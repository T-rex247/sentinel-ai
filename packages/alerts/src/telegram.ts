import { Bot } from "grammy";
import type { Alert, Agent } from "@sentinel-ai/shared";
import { getSupabaseServer, SOLSCAN_TX_URL } from "@sentinel-ai/shared";

let bot: Bot | null = null;

export function getTelegramBot(): Bot {
  if (bot) return bot;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");

  bot = new Bot(token);

  bot.command("start", (ctx) =>
    ctx.reply(
      "🛡️ *SentinelAI* — AI Agent Security Monitor\n\n" +
        "I'll alert you when your monitored Solana agent wallets show suspicious activity.\n\n" +
        "Commands:\n" +
        "/register <wallet> — Monitor a wallet\n" +
        "/status — Show monitored wallets\n" +
        "/alerts — Recent alerts",
      { parse_mode: "Markdown" }
    )
  );

  bot.command("register", async (ctx) => {
    const wallet = ctx.match?.trim();
    if (!wallet || wallet.length < 32 || wallet.length > 44) {
      return ctx.reply("Usage: /register <solana_wallet_address>");
    }

    const supabase = getSupabaseServer();
    const chatId = ctx.chat.id;

    // Check if already registered
    const { data: existing } = await supabase
      .from("agents")
      .select("id")
      .eq("wallet_address", wallet)
      .single();

    if (existing) {
      await supabase
        .from("agents")
        .update({ telegram_chat_id: chatId })
        .eq("id", existing.id);
      return ctx.reply(`✅ Updated alerts for wallet \`${wallet.slice(0, 8)}...\` to this chat.`, {
        parse_mode: "Markdown",
      });
    }

    const { error } = await supabase.from("agents").insert({
      wallet_address: wallet,
      label: `TG-${chatId}`,
      telegram_chat_id: chatId,
      config: {},
    });

    if (error) {
      return ctx.reply(`❌ Error: ${error.message}`);
    }
    return ctx.reply(`✅ Now monitoring wallet \`${wallet.slice(0, 8)}...\``, {
      parse_mode: "Markdown",
    });
  });

  bot.command("status", async (ctx) => {
    const supabase = getSupabaseServer();
    const { data: agents } = await supabase
      .from("agents")
      .select("wallet_address, label, is_active")
      .eq("telegram_chat_id", ctx.chat.id);

    if (!agents?.length) {
      return ctx.reply("No wallets monitored. Use /register <wallet> to start.");
    }

    const lines = agents.map(
      (a) =>
        `${a.is_active ? "🟢" : "🔴"} \`${a.wallet_address.slice(0, 8)}...\` — ${a.label ?? "unlabeled"}`
    );
    return ctx.reply("*Monitored Wallets:*\n" + lines.join("\n"), {
      parse_mode: "Markdown",
    });
  });

  bot.command("alerts", async (ctx) => {
    const supabase = getSupabaseServer();
    const { data: alerts } = await supabase
      .from("alerts")
      .select("severity, title, tx_signature, created_at")
      .eq("agent_id", ctx.chat.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!alerts?.length) {
      return ctx.reply("No recent alerts. All clear! ✅");
    }

    const lines = alerts.map((a) => {
      const icon = SEVERITY_ICON[a.severity as string] ?? "⚪";
      return `${icon} ${a.title}`;
    });
    return ctx.reply("*Recent Alerts:*\n" + lines.join("\n"), {
      parse_mode: "Markdown",
    });
  });

  return bot;
}

const SEVERITY_ICON: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
};

export async function sendTelegramAlert(
  agent: Agent,
  alert: Alert
): Promise<boolean> {
  if (!agent.telegram_chat_id) return false;

  try {
    const b = getTelegramBot();
    const icon = SEVERITY_ICON[alert.severity] ?? "⚪";
    const txLink = alert.tx_signature
      ? `[View Tx](${SOLSCAN_TX_URL}${alert.tx_signature})`
      : "";

    await b.api.sendMessage(
      agent.telegram_chat_id,
      `${icon} *${alert.title}*\n\n${alert.message}\n\n${txLink}`,
      { parse_mode: "Markdown" }
    );

    // Mark as sent
    const supabase = getSupabaseServer();
    await supabase
      .from("alerts")
      .update({ telegram_sent: true })
      .eq("id", alert.id);

    return true;
  } catch (err) {
    console.error("[Telegram] Failed to send alert:", err);
    return false;
  }
}
