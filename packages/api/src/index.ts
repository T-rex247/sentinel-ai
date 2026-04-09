import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { getSupabaseServer } from "@sentinel-ai/shared";
import { SolanaSubscriber } from "@sentinel-ai/listener";
import { scoreTransaction } from "@sentinel-ai/risk-engine";
import { sendTelegramAlert, getTelegramBot } from "@sentinel-ai/alerts";
import type { Agent, DecodedTransaction } from "@sentinel-ai/shared";

import healthRouter from "./routes/health.js";
import agentsRouter from "./routes/agents.js";
import alertsRouter from "./routes/alerts.js";
import riskRouter from "./routes/risk.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use(healthRouter);
app.use("/api", agentsRouter);
app.use("/api", alertsRouter);
app.use("/api", riskRouter);

// ── Solana Listener ────────────────────────────────────────────────

const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const wsUrl = process.env.SOLANA_WS_URL ?? "wss://api.mainnet-beta.solana.com";
const subscriber = new SolanaSubscriber(rpcUrl, wsUrl);

// Handle incoming transactions
subscriber.on("transaction", async (agentId: string, tx: DecodedTransaction) => {
  console.log(`[Pipeline] Scoring tx ${tx.signature} for agent ${agentId}`);

  const supabase = getSupabaseServer();
  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (!agent) return;

  const { riskScore, shouldAlert } = await scoreTransaction(agent as Agent, tx);
  console.log(`[Pipeline] Score: ${riskScore.score} | Alert: ${shouldAlert}`);

  if (shouldAlert) {
    // Fetch the alert we just created
    const { data: alert } = await supabase
      .from("alerts")
      .select("*")
      .eq("risk_score_id", riskScore.id)
      .single();

    if (alert) {
      await sendTelegramAlert(agent as Agent, alert);
    }
  }
});

subscriber.on("error", (err: Error) => {
  console.error("[Pipeline] Listener error:", err.message);
});

// ── Bootstrap ──────────────────────────────────────────────────────

async function bootstrap() {
  const supabase = getSupabaseServer();

  // Load all active agents and subscribe
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .eq("is_active", true);

  if (agents?.length) {
    console.log(`[Bootstrap] Subscribing to ${agents.length} agent wallets...`);
    for (const agent of agents) {
      await subscriber.subscribe(agent.id, agent.wallet_address);
    }
  }

  // Start Telegram bot (non-blocking)
  try {
    const bot = getTelegramBot();
    bot.start({ onStart: () => console.log("[Telegram] Bot started") });
  } catch (err) {
    console.warn("[Telegram] Bot not started:", (err as Error).message);
  }

  // Start Express server
  app.listen(PORT, () => {
    console.log(`[SentinelAI] API running on http://localhost:${PORT}`);
    console.log(`[SentinelAI] Monitoring ${subscriber.getActiveSubscriptions()} wallets`);
  });
}

bootstrap().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[SentinelAI] Shutting down...");
  await subscriber.shutdown();
  process.exit(0);
});
