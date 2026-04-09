import { Router } from "express";
import { getSupabaseServer } from "@sentinel-ai/shared";

const router = Router();

// List alerts with optional filters
router.get("/alerts", async (req, res) => {
  const supabase = getSupabaseServer();
  const { agent_id, severity, limit = "50", offset = "0" } = req.query;

  let query = supabase
    .from("alerts")
    .select("*, agents(wallet_address, label)")
    .order("created_at", { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (agent_id) query = query.eq("agent_id", agent_id as string);
  if (severity) query = query.eq("severity", severity as string);

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json({ alerts: data });
});

// Acknowledge an alert
router.patch("/alerts/:id/acknowledge", async (req, res) => {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("alerts")
    .update({ acknowledged: true })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
