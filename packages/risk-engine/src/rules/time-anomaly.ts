import type { RiskRule, RiskRuleContext, RuleResult } from "@sentinel-ai/shared";

/**
 * Time anomaly detection — flags transactions occurring at unusual hours.
 * AI agents typically operate on predictable schedules. Transactions at
 * odd hours (e.g. 2-5 AM in the agent's expected timezone) may indicate
 * compromised credentials being used by an attacker in a different timezone.
 */
export const timeAnomalyRule: RiskRule = {
  name: "time_anomaly",
  evaluate(ctx: RiskRuleContext): RuleResult {
    const { transaction } = ctx;

    if (!transaction.block_time) {
      return {
        rule: "time_anomaly",
        score: 0,
        reason: "No block time available",
        triggered: false,
      };
    }

    const txTime = new Date(transaction.block_time);
    const utcHour = txTime.getUTCHours();

    // Flag transactions between 2-5 AM UTC as suspicious
    // (most legitimate agent operations happen during business hours)
    const isSuspiciousHour = utcHour >= 2 && utcHour <= 5;

    if (!isSuspiciousHour) {
      return {
        rule: "time_anomaly",
        score: 0,
        reason: "Normal operating hours",
        triggered: false,
      };
    }

    // Only flag outbound transfers during odd hours
    if (transaction.decoded_data.direction !== "outbound") {
      return {
        rule: "time_anomaly",
        score: 0,
        reason: "Inbound during off-hours — not suspicious",
        triggered: false,
      };
    }

    return {
      rule: "time_anomaly",
      score: 25,
      reason: `Outbound transfer at ${utcHour}:${String(txTime.getUTCMinutes()).padStart(2, "0")} UTC — unusual operating hours`,
      triggered: true,
    };
  },
};
