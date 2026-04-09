import type { RiskRule, RiskRuleContext, RuleResult } from "@sentinel-ai/shared";

/**
 * Allowlist violation — flags interactions with programs not in the agent's
 * expected program set. If an agent is configured to only trade on Jupiter
 * and Raydium, any interaction with an unknown program is suspicious.
 */
export const allowlistViolationRule: RiskRule = {
  name: "allowlist_violation",
  evaluate(ctx: RiskRuleContext): RuleResult {
    const { agent, transaction } = ctx;
    const allowlist = agent.config.allowlist ?? [];

    // If no allowlist configured, skip this rule
    // (unknown_recipient rule handles wallet-level allowlisting)
    if (allowlist.length === 0) {
      return {
        rule: "allowlist_violation",
        score: 0,
        reason: "No allowlist configured",
        triggered: false,
      };
    }

    // Check if the program being called is in the allowlist
    const programId = transaction.program_id;
    const allAccounts = transaction.accounts;

    // Check if any account in the transaction is outside the allowlist
    const violatingAccounts = allAccounts.filter(
      (acct) => !allowlist.includes(acct) && acct !== agent.wallet_address
    );

    // If the destination is not in the allowlist, that's a violation
    const destination = transaction.decoded_data.destination as string | undefined;
    if (destination && !allowlist.includes(destination)) {
      return {
        rule: "allowlist_violation",
        score: 50,
        reason: `Destination ${destination.slice(0, 8)}... not in allowlist (${allowlist.length} allowed addresses)`,
        triggered: true,
      };
    }

    // If interacting with an unlisted program
    if (!allowlist.includes(programId) && violatingAccounts.length > 0) {
      return {
        rule: "allowlist_violation",
        score: 35,
        reason: `Program ${programId.slice(0, 8)}... and ${violatingAccounts.length} accounts not in allowlist`,
        triggered: true,
      };
    }

    return {
      rule: "allowlist_violation",
      score: 0,
      reason: "All interactions within allowlist",
      triggered: false,
    };
  },
};
