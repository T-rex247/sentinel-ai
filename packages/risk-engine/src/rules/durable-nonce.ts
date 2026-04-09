import type { RiskRule, RiskRuleContext, RuleResult } from "@sentinel-ai/shared";

/**
 * Durable nonce detection — the exact attack vector from the Drift hack ($270M).
 * Durable nonces allow pre-signing transactions that can be submitted later,
 * bypassing normal blockhash expiry. Legitimate use is rare for AI agents.
 */
export const durableNonceRule: RiskRule = {
  name: "durable_nonce",
  evaluate(ctx: RiskRuleContext): RuleResult {
    const { transaction } = ctx;

    // Check if transaction interacts with the System Program's nonce instructions
    const nonceInstructionTypes = [
      "advanceNonce",
      "advanceNonceAccount",
      "initializeNonce",
      "initializeNonceAccount",
      "authorizeNonce",
      "authorizeNonceAccount",
      "withdrawFromNonce",
      "withdrawNonceAccount",
    ];

    const ixType = transaction.instruction_type ?? "";
    const isNonceIx = nonceInstructionTypes.some(
      (t) => ixType.toLowerCase() === t.toLowerCase()
    );

    // Also check decoded_data for nonce-related fields
    const hasNonceData =
      transaction.decoded_data.nonceAccount != null ||
      transaction.decoded_data.nonceAuthority != null ||
      transaction.decoded_data.nonce != null;

    if (isNonceIx || hasNonceData) {
      return {
        rule: "durable_nonce",
        score: 70,
        reason: `Durable nonce detected (${ixType || "nonce fields in data"}) — matches Drift hack vector`,
        triggered: true,
      };
    }

    return {
      rule: "durable_nonce",
      score: 0,
      reason: "No nonce usage",
      triggered: false,
    };
  },
};
