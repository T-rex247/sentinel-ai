import type { Alert } from "../lib/api";
import { acknowledgeAlert } from "../lib/api";
import { severityBg, severityColor, timeAgo, shortenAddress, SOLSCAN_TX } from "../lib/utils";
import { useState } from "react";

export default function AlertCard({ alert, onAck }: { alert: Alert; onAck?: () => void }) {
  const [acking, setAcking] = useState(false);

  const handleAck = async () => {
    setAcking(true);
    try {
      await acknowledgeAlert(alert.id);
      onAck?.();
    } finally {
      setAcking(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${severityBg(alert.severity)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase ${severityColor(alert.severity)}`}>
              {alert.severity}
            </span>
            <span className="text-xs text-gray-500">{timeAgo(alert.created_at)}</span>
          </div>
          <p className="text-sm font-medium text-white truncate">{alert.title}</p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{alert.message}</p>
          {alert.tx_signature && (
            <a
              href={`${SOLSCAN_TX}${alert.tx_signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sentinel-accent hover:underline mt-1 inline-block"
            >
              {shortenAddress(alert.tx_signature, 8)}
            </a>
          )}
          {alert.agents && (
            <p className="text-xs text-gray-500 mt-1">
              {alert.agents.label ?? shortenAddress(alert.agents.wallet_address)}
            </p>
          )}
        </div>
        {!alert.acknowledged && (
          <button
            onClick={handleAck}
            disabled={acking}
            className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-sentinel-border transition-colors shrink-0"
          >
            {acking ? "..." : "Ack"}
          </button>
        )}
        {alert.acknowledged && (
          <span className="text-xs text-gray-600 shrink-0">Acked</span>
        )}
      </div>
    </div>
  );
}
