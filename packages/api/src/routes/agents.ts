import { Router } from "express";
import { getSupabaseServer, AgentConfigSchema } from "@sentinel-ai/shared";

const router = Router();

// List all agents
router.get("/agents", async (_req, res) => {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("agents")
    .select("id, wallet_address, label, is_active, config, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ agents: data });
});

// Get single agent
router.get("/agents/:id", async (req, res) => {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Agent not found" });
  res.json(data);
});

// Register a new agent wallet
router.post("/agents", async (req, res) => {
  const { wallet_address, label, telegram_chat_id, webhook_url, config } = req.body;

  if (!wallet_address || wallet_address.length < 32 || wallet_address.length > 44) {
    return res.status(400).json({ error: "Invalid wallet_address" });
  }

  const parsedConfig = AgentConfigSchema.safeParse(config ?? {});
  if (!parsedConfig.success) {
    return res.status(400).json({ error: "Invalid config", details: parsedConfig.error.issues });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("agents")
    .insert({
      wallet_address,
      label: label ?? null,
      telegram_chat_id: telegram_chat_id ?? null,
      webhook_url: webhook_url ?? null,
      config: parsedConfig.data,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Wallet already registered" });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

// Delete an agent
router.delete("/agents/:id", async (req, res) => {
  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

export default router;
