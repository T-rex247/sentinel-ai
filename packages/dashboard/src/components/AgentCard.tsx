import { Link } from "react-router-dom";
import type { Agent } from "../lib/api";
import { shortenAddress, timeAgo, SOLSCAN_ACCOUNT } from "../lib/utils";

export default function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="bg-sentinel-card border border-sentinel-border rounded-lg p-4 hover:border-sentinel-accent/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agent.is_active ? "bg-green-400" : "bg-gray-600"}`} />
          <span className="text-sm font-medium">
            {agent.label ?? shortenAddress(agent.wallet_address)}
          </span>
        </div>
        <span className="text-xs text-gray-500">{timeAgo(agent.created_at)}</span>
      </div>
      <a
        href={`${SOLSCAN_ACCOUNT}${agent.wallet_address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-400 font-mono hover:text-sentinel-accent transition-colors"
      >
        {shortenAddress(agent.wallet_address, 6)}
      </a>
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span>Threshold: {agent.config.balance_threshold_sol} SOL</span>
        <span>Transfer: {agent.config.transfer_pct_threshold}%</span>
      </div>
      <Link
        to={`/agents/${agent.id}`}
        className="mt-3 block text-xs text-sentinel-accent hover:underline"
      >
        View details
      </Link>
    </div>
  );
}
