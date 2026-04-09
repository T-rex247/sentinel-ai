import type {
  Agent,
  BalanceSnapshot,
  DecodedTransaction,
  RiskRuleContext,
  RiskScore,
  RuleName,
  RuleResult,
  ClaudeAnalysis,
} from "@sentinel-ai/shared";
import {
  getSupabaseServer,
  RISK_THRESHOLD_CLAUDE,
  RISK_THRESHOLD_ALERT,
  scoreSeverity,
} from "@sentinel-ai/shared";
import { allRules } from "./rules/index.js";
import { analyzeWithClaude } from "./claude-analyzer.js";

export async function scoreTransaction(
  agent: Agent,
  transaction: DecodedTransaction
): Promise<{
  riskScore: RiskScore;
  shouldAlert: boolean;
}> {
  const supabase = getSupabaseServer();

  // Fetch recent transactions for context
  const { data: recentTxs } = await supabase
    .from("transactions")
    .select("*")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch latest balance snapshot
  const { data: balanceRows } = await supabase
    .from("balance_snapshots")
    .select("*")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const balance: BalanceSnapshot | null = balanceRows?.[0] ?? null;
  const recentTransactions: DecodedTransaction[] = (recentTxs ?? []).map(
    (row) => ({
      signature: row.signature,
      slot: row.slot,
      block_time: row.block_time,
      program_id: row.program_id,
      instruction_type: row.instruction_type,
      decoded_data: row.decoded_data,
      accounts: row.accounts,
      sol_amount: row.sol_amount ? Number(row.sol_amount) : null,
      token_amount: row.token_amount ? Number(row.token_amount) : null,
      token_mint: row.token_mint,
    })
  );

  const ctx: RiskRuleContext = {
    agent,
    transaction,
    recent_transactions: recentTransactions,
    balance,
  };

  // Run all rules
  const results: RuleResult[] = allRules.map((rule) => rule.evaluate(ctx));
  const ruleScores: Record<string, number> = {};
  let totalScore = 0;

  for (const result of results) {
    ruleScores[result.rule] = result.score;
    totalScore += result.score;
  }

  // Cap at 100
  totalScore = Math.min(100, totalScore);

  // Run Claude analysis if score is elevated
  let claudeAnalysis: ClaudeAnalysis | null = null;
  if (totalScore >= RISK_THRESHOLD_CLAUDE) {
    claudeAnalysis = await analyzeWithClaude(
      transaction,
      recentTransactions,
      totalScore
    );
    totalScore = Math.max(0, Math.min(100, totalScore + claudeAnalysis.risk_adjustment));
  }

  // Store the transaction
  const { data: txRow } = await supabase
    .from("transactions")
    .insert({
      agent_id: agent.id,
      signature: transaction.signature,
      slot: transaction.slot,
      block_time: transaction.block_time,
      program_id: transaction.program_id,
      instruction_type: transaction.instruction_type,
      decoded_data: transaction.decoded_data,
      accounts: transaction.accounts,
      sol_amount: transaction.sol_amount,
      token_amount: transaction.token_amount,
      token_mint: transaction.token_mint,
    })
    .select("id")
    .single();

  // Store risk score
  const { data: riskRow } = await supabase
    .from("risk_scores")
    .insert({
      agent_id: agent.id,
      transaction_id: txRow?.id ?? null,
      score: totalScore,
      rule_scores: ruleScores,
      claude_analysis: claudeAnalysis,
    })
    .select()
    .single();

  const shouldAlert = totalScore >= RISK_THRESHOLD_ALERT;

  // Create alert if threshold met
  if (shouldAlert && riskRow) {
    const severity = scoreSeverity(totalScore);
    const triggeredRules = results
      .filter((r) => r.triggered)
      .map((r) => r.reason)
      .join("; ");

    await supabase.from("alerts").insert({
      agent_id: agent.id,
      risk_score_id: riskRow.id,
      severity,
      title: `${severity.toUpperCase()}: Risk score ${totalScore} for ${agent.label ?? agent.wallet_address.slice(0, 8)}`,
      message: triggeredRules + (claudeAnalysis ? `\n\nAI: ${claudeAnalysis.explanation}` : ""),
      tx_signature: transaction.signature,
    });
  }

  return {
    riskScore: riskRow as RiskScore,
    shouldAlert,
  };
}
