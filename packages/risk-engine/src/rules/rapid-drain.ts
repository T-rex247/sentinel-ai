import type { RiskRule, RiskRuleContext, RuleResult } from "@sentinel-ai/shared";
import { RAPID_DRAIN_WINDOW_MS, RAPID_DRAIN_MIN_TXS } from "@sentinel-ai/shared";

export const rapidDrainRule: RiskRule = {
  name: "rapid_drain",
  evaluate(ctx: RiskRuleContext): RuleResult {
    const { transaction, recent_transactions } = ctx;
    const now = transaction.block_time
      ? new Date(transaction.block_time).getTime()
      : Date.now();

    // Count outbound transfers within the window
    const recentOutbound = recent_transactions.filter((tx) => {
      if (tx.decoded_data.direction !== "outbound") return false;
      const txTime = tx.block_time ? new Date(tx.block_time).getTime() : 0;
      return now - txTime <= RAPID_DRAIN_WINDOW_MS;
    });

    // Include current transaction if outbound
    const totalOutbound =
      transaction.decoded_data.direction === "outbound"
        ? recentOutbound.length + 1
        : recentOutbound.length;

    if (totalOutbound >= RAPID_DRAIN_MIN_TXS) {
      const score = Math.min(100, 30 + totalOutbound * 15);
      return {
        rule: "rapid_drain",
        score,
        reason: `${totalOutbound} outbound transfers in ${RAPID_DRAIN_WINDOW_MS / 1000}s window`,
        triggered: true,
      };
    }

    return { rule: "rapid_drain", score: 0, reason: "Normal frequency", triggered: false };
  },
};
