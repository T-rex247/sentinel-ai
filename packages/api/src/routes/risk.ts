import { Router } from "express";
import { getSupabaseServer } from "@sentinel-ai/shared";

const router = Router();

// Get current risk score for a wallet
router.get("/risk/:wallet", async (req, res) => {
  const supabase = getSupabaseServer();
  const { wallet } = req.params;

  // Find agent
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("wallet_address", wallet)
    .single();

  if (!agent) return res.status(404).json({ error: "Wallet not monitored" });

  // Get latest risk score
  const { data: latest } = await supabase
    .from("risk_scores")
    .select("*")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get risk history (last 50)
  const { data: history } = await supabase
    .from("risk_scores")
    .select("score, created_at")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(50);

  res.json({
    wallet,
    current: latest ?? null,
    history: history ?? [],
  });
});

export default router;
