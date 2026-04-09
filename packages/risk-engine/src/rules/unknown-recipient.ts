import type { RiskRule, RiskRuleContext, RuleResult } from "@sentinel-ai/shared";

export const unknownRecipientRule: RiskRule = {
  name: "unknown_recipient",
  evaluate(ctx: RiskRuleContext): RuleResult {
    const { agent, transaction } = ctx;
    const allowlist = agent.config.allowlist ?? [];

    if (transaction.decoded_data.direction !== "outbound") {
      return { rule: "unknown_recipient", score: 0, reason: "Inbound", triggered: false };
    }

    const destination = transaction.decoded_data.destination as string | undefined;
    if (!destination) {
      return { rule: "unknown_recipient", score: 0, reason: "No destination", triggered: false };
    }

    // If no allowlist configured, flag all outbound to unknown wallets
    if (allowlist.length === 0) {
      // Check if we've seen this recipient before
      const knownRecipients = new Set(
        ctx.recent_transactions
          .filter((t) => t.decoded_data.direction === "outbound")
          .map((t) => t.decoded_data.destination as string)
          .filter(Boolean)
      );

      if (!knownRecipients.has(destination)) {
        return {
          rule: "unknown_recipient",
          score: 40,
          reason: `First-time recipient: ${destination.slice(0, 8)}...`,
          triggered: true,
        };
      }
      return { rule: "unknown_recipient", score: 0, reason: "Known recipient", triggered: false };
    }

    if (!allowlist.includes(destination)) {
      return {
        rule: "unknown_recipient",
        score: 50,
        reason: `Recipient ${destination.slice(0, 8)}... not in allowlist`,
        triggered: true,
      };
    }

    return { rule: "unknown_recipient", score: 0, reason: "Allowlisted", triggered: false };
  },
};
