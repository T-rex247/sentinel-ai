import { z } from "zod";

// ── Agent ──────────────────────────────────────────────────────────

export const AgentConfigSchema = z.object({
  allowlist: z.array(z.string()).default([]),
  balance_threshold_sol: z.number().default(1.0),
  transfer_pct_threshold: z.number().min(1).max(100).default(50),
  alert_cooldown_seconds: z.number().default(300),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export interface Agent {
  id: string;
  wallet_address: string;
  label: string | null;
  owner_id: string | null;
  telegram_chat_id: number | null;
  webhook_url: string | null;
  config: AgentConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Decoded Transaction ────────────────────────────────────────────

export interface DecodedTransaction {
  signature: string;
  slot: number;
  block_time: string | null;
  program_id: string;
  instruction_type: string | null;
  decoded_data: Record<string, unknown>;
  accounts: string[];
  sol_amount: number | null;
  token_amount: number | null;
  token_mint: string | null;
}

// ── Risk Scoring ───────────────────────────────────────────────────

export type RuleName =
  | "transfer_amount"
  | "unknown_recipient"
  | "rapid_drain"
  | "balance_threshold"
  | "durable_nonce"
  | "time_anomaly"
  | "allowlist_violation";

export interface RuleResult {
  rule: RuleName;
  score: number; // 0-100 contribution
  reason: string;
  triggered: boolean;
}

export interface ClaudeAnalysis {
  risk_adjustment: number; // -20 to +20
  explanation: string;
}

export interface RiskScore {
  id: string;
  agent_id: string;
  transaction_id: string | null;
  score: number; // 0-100 final
  rule_scores: Record<RuleName, number>;
  claude_analysis: ClaudeAnalysis | null;
  created_at: string;
}

// ── Alerts ─────────────────────────────────────────────────────────

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface Alert {
  id: string;
  agent_id: string;
  risk_score_id: string | null;
  severity: AlertSeverity;
  title: string;
  message: string;
  tx_signature: string | null;
  telegram_sent: boolean;
  webhook_sent: boolean;
  acknowledged: boolean;
  created_at: string;
}

// ── Balance Snapshot ───────────────────────────────────────────────

export interface TokenBalance {
  amount: number;
  symbol: string;
}

export interface BalanceSnapshot {
  id: string;
  agent_id: string;
  sol_balance: number;
  token_balances: Record<string, TokenBalance>;
  created_at: string;
}

// ── API Key ────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  owner_id: string;
  key_hash: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  last_used: string | null;
}

// ── Risk Rule Interface ────────────────────────────────────────────

export interface RiskRuleContext {
  agent: Agent;
  transaction: DecodedTransaction;
  recent_transactions: DecodedTransaction[];
  balance: BalanceSnapshot | null;
}

export interface RiskRule {
  name: RuleName;
  evaluate(ctx: RiskRuleContext): RuleResult;
}

// ── Severity thresholds ────────────────────────────────────────────

export function scoreSeverity(score: number): AlertSeverity {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}
