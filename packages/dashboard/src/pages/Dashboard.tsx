import { useEffect, useState } from "react";
import { getAgents, getAlerts, type Agent, type Alert } from "../lib/api";
import { supabase } from "../lib/supabase";
import AlertCard from "../components/AlertCard";
import RiskGauge from "../components/RiskGauge";

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [agentRes, alertRes] = await Promise.all([getAgents(), getAlerts()]);
      setAgents(agentRes.agents);
      setAlerts(alertRes.alerts);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // Realtime alerts
    const channel = supabase
      .channel("dashboard-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const highCount = alerts.filter((a) => a.severity === "high" && !a.acknowledged).length;
  const activeAgents = agents.filter((a) => a.is_active).length;
  const recentAlerts = alerts.slice(0, 5);

  // Highest unacked score as "system risk"
  const latestCritical = alerts.find((a) => !a.acknowledged);
  const systemRisk = latestCritical
    ? latestCritical.severity === "critical" ? 90
    : latestCritical.severity === "high" ? 70
    : latestCritical.severity === "medium" ? 45
    : 20
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Agents" value={activeAgents} />
        <StatCard label="Critical Alerts" value={criticalCount} color="text-red-500" />
        <StatCard label="High Alerts" value={highCount} color="text-orange-500" />
        <div className="bg-sentinel-card border border-sentinel-border rounded-lg p-4 flex items-center justify-center">
          <RiskGauge score={systemRisk} />
        </div>
      </div>

      {/* Recent alerts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Alerts</h2>
        {recentAlerts.length === 0 ? (
          <p className="text-gray-500 text-sm">No alerts yet. All clear.</p>
        ) : (
          <div className="space-y-2">
            {recentAlerts.map((a) => (
              <AlertCard key={a.id} alert={a} onAck={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-white" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-sentinel-card border border-sentinel-border rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
