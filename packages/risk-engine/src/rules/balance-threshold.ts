import type { RiskRule, RiskRuleContext, RuleResult } from "@sentinel-ai/shared";

export const balanceThresholdRule: RiskRule = {
  name: "balance_threshold",
  evaluate(ctx: RiskRuleContext): RuleResult {
    const { agent, transaction, balance } = ctx;
    const threshold = agent.config.balance_threshold_sol ?? 1.0;

    if (!balance) {
      return { rule: "balance_threshold", score: 0, reason: "No balance data", triggered: false };
    }

    if (transaction.decoded_data.direction !== "outbound") {
      return { rule: "balance_threshold", score: 0, reason: "Inbound", triggered: false };
    }

    const solAmount = transaction.sol_amount ?? 0;
    const projectedBalance = balance.sol_balance - solAmount;

    if (projectedBalance < threshold) {
      const score = projectedBalance <= 0 ? 80 : 50;
      return {
        rule: "balance_threshold",
        score,
        reason: `Balance would drop to ${projectedBalance.toFixed(4)} SOL (threshold: ${threshold} SOL)`,
        triggered: true,
      };
    }

    return { rule: "balance_threshold", score: 0, reason: "Above threshold", triggered: false };
  },
};
