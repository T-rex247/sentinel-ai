import Anthropic from "@anthropic-ai/sdk";
import type { ClaudeAnalysis, DecodedTransaction } from "@sentinel-ai/shared";
import { CLAUDE_MODEL } from "@sentinel-ai/shared";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

const SYSTEM_PROMPT = `You are a security analyst for AI agent wallets on Solana. You analyze transactions for anomalous behavior that could indicate compromise, unauthorized access, or wallet drain attacks.

Context: AI agents are automated programs with wallet signing authority. They execute trades, transfers, and DeFi operations. When compromised, attackers drain funds quickly — often using rapid sequential transfers, durable nonces for pre-signed transactions, or routing through intermediary wallets.

Your job: Given the current transaction and recent history, assess whether this transaction pattern is suspicious. Consider:
- Is the amount unusual relative to history?
- Is the recipient new or unusual?
- Is the transaction timing suspicious?
- Does the pattern match known attack vectors (rapid drain, nonce abuse)?

Respond with JSON only:
{
  "risk_adjustment": <number from -20 to 20>,
  "explanation": "<brief explanation>"
}

A positive adjustment INCREASES risk. A negative adjustment DECREASES risk (if the pattern looks normal).`;

export async function analyzeWithClaude(
  currentTx: DecodedTransaction,
  recentTxs: DecodedTransaction[],
  currentRuleScore: number
): Promise<ClaudeAnalysis> {
  const userMessage = `Current transaction:
${JSON.stringify(currentTx, null, 2)}

Recent transactions (last 10):
${JSON.stringify(recentTxs.slice(-10), null, 2)}

Current rule-based risk score: ${currentRuleScore}/100

Analyze and respond with JSON only.`;

  try {
    const response = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    return {
      risk_adjustment: Math.max(-20, Math.min(20, parsed.risk_adjustment ?? 0)),
      explanation: parsed.explanation ?? "No explanation provided",
    };
  } catch (err) {
    console.error("[Claude] Analysis failed:", err);
    return { risk_adjustment: 0, explanation: "Analysis unavailable" };
  }
}
