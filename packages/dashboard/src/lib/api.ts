const BASE = "/api";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function patchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "PATCH" });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function deleteJSON(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
}

// Agents
export const getAgents = () => fetchJSON<{ agents: Agent[] }>("/agents");
export const getAgent = (id: string) => fetchJSON<Agent>(`/agents/${id}`);
export const registerAgent = (data: RegisterAgentData) =>
  postJSON<Agent>("/agents", data);
export const deleteAgent = (id: string) => deleteJSON(`/agents/${id}`);

// Alerts
export const getAlerts = (params?: AlertFilters) => {
  const qs = new URLSearchParams();
  if (params?.agent_id) qs.set("agent_id", params.agent_id);
  if (params?.severity) qs.set("severity", params.severity);
  const q = qs.toString();
  return fetchJSON<{ alerts: Alert[] }>(`/alerts${q ? `?${q}` : ""}`);
};
export const acknowledgeAlert = (id: string) =>
  patchJSON<Alert>(`/alerts/${id}/acknowledge`);

// Risk
export const getRisk = (wallet: string) =>
  fetchJSON<RiskData>(`/risk/${wallet}`);

// Health
export const getHealth = () =>
  fetchJSON<{ status: string; service: string; timestamp: string }>("/health");

// Types
export interface Agent {
  id: string;
  wallet_address: string;
  label: string | null;
  is_active: boolean;
  config: {
    allowlist: string[];
    balance_threshold_sol: number;
    transfer_pct_threshold: number;
    alert_cooldown_seconds: number;
  };
  created_at: string;
  updated_at: string;
}

export interface RegisterAgentData {
  wallet_address: string;
  label?: string;
  telegram_chat_id?: number;
  webhook_url?: string;
  config?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  agent_id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  tx_signature: string | null;
  telegram_sent: boolean;
  webhook_sent: boolean;
  acknowledged: boolean;
  created_at: string;
  agents?: { wallet_address: string; label: string | null };
}

export interface AlertFilters {
  agent_id?: string;
  severity?: string;
}

export interface RiskScore {
  id: string;
  score: number;
  rule_scores: Record<string, number>;
  claude_analysis: { risk_adjustment: number; explanation: string } | null;
  created_at: string;
}

export interface RiskData {
  wallet: string;
  current: RiskScore | null;
  history: { score: number; created_at: string }[];
}
