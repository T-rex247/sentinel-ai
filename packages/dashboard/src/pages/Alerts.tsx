import { useEffect, useState } from "react";
import { getAlerts, type Alert } from "../lib/api";
import { supabase } from "../lib/supabase";
import AlertCard from "../components/AlertCard";

const SEVERITIES = ["all", "critical", "high", "medium", "low"] as const;

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<string>("all");
  const [showAcked, setShowAcked] = useState(false);

  const load = async () => {
    try {
      const res = await getAlerts(
        severity !== "all" ? { severity } : undefined,
      );
      setAlerts(res.alerts);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [severity]);

  useEffect(() => {
    const channel = supabase
      .channel("alerts-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [severity]);

  const filtered = showAcked
    ? alerts
    : alerts.filter((a) => !a.acknowledged);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Alerts</h1>

        <div className="flex items-center gap-3">
          {/* Severity filter */}
          <div className="flex gap-1">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                  severity === s
                    ? "bg-sentinel-accent/10 text-sentinel-accent border border-sentinel-accent/30"
                    : "text-gray-400 hover:text-white border border-sentinel-border hover:border-gray-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Toggle acknowledged */}
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAcked}
              onChange={(e) => setShowAcked(e.target.checked)}
              className="accent-sentinel-accent"
            />
            Show acknowledged
          </label>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">
        {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-1">No alerts</p>
          <p className="text-sm">
            {severity !== "all"
              ? `No ${severity} alerts found.`
              : "All clear — no unacknowledged alerts."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <AlertCard key={a.id} alert={a} onAck={load} />
          ))}
        </div>
      )}
    </div>
  );
}
