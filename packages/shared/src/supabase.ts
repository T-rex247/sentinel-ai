import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (serverClient) return serverClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  serverClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return serverClient;
}
