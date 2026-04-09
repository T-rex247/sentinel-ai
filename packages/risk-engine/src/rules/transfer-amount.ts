import type { RiskRule, RiskRuleContext, RuleResult } from "@sentinel-ai/shared";

export const transferAmountRule: RiskRule = {
  name: "transfer_amount",
  evaluate(ctx: RiskRuleContext): RuleResult {
    const { agent, transaction, balance } = ctx;
    const threshold = agent.config.transfer_pct_threshold ?? 50;

    // Only check outbound transfers
    if (transaction.decoded_data.direction !== "outbound") {
      return { rule: "transfer_amount", score: 0, reason: "Inbound or non-transfer", triggered: false };
    }

    if (!balance || balance.sol_balance <= 0) {
      return { rule: "transfer_amount", score: 0, reason: "No balance data", triggered: false };
    }

    const solAmount = transaction.sol_amount ?? 0;
    if (solAmount <= 0) {
      return { rule: "transfer_amount", score: 0, reason: "No SOL amount", triggered: false };
    }

    const pct = (solAmount / balance.sol_balance) * 100;
    if (pct >= threshold) {
      const score = Math.min(100, Math.round(pct));
      return {
        rule: "transfer_amount",
        score,
        reason: `Transfer of ${solAmount.toFixed(4)} SOL is ${pct.toFixed(1)}% of balance (threshold: ${threshold}%)`,
        triggered: true,
      };
    }

    return { rule: "transfer_amount", score: 0, reason: "Within threshold", triggered: false };
  },
};
