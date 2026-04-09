import { useEffect, useState } from "react";
import { getAgents, registerAgent, deleteAgent, type Agent } from "../lib/api";
import AgentCard from "../components/AgentCard";

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [wallet, setWallet] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await getAgents();
      setAgents(res.agents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await registerAgent({ wallet_address: wallet, label: label || undefined });
      setWallet("");
      setLabel("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this agent?")) return;
    await deleteAgent(id);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monitored Agents</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-sentinel-accent text-black hover:bg-sentinel-accent/90 transition-colors"
        >
          + Register Wallet
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRegister} className="bg-sentinel-card border border-sentinel-border rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Solana Wallet Address</label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Enter wallet address..."
              className="w-full bg-sentinel-bg border border-sentinel-border rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-sentinel-accent focus:outline-none"
              required
              minLength={32}
              maxLength={44}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Trading Bot #1"
              className="w-full bg-sentinel-bg border border-sentinel-border rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-sentinel-accent focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded text-sm font-medium bg-sentinel-accent text-black hover:bg-sentinel-accent/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Registering..." : "Register"}
          </button>
        </form>
      )}

      {agents.length === 0 ? (
        <p className="text-gray-500 text-sm">No agents registered. Click "Register Wallet" to start monitoring.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      )}
    </div>
  );
}
