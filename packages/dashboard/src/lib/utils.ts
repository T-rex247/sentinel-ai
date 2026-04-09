export function shortenAddress(addr: string, chars = 4): string {
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function severityColor(sev: string): string {
  switch (sev) {
    case "critical": return "text-red-500";
    case "high": return "text-orange-500";
    case "medium": return "text-yellow-500";
    case "low": return "text-green-400";
    default: return "text-gray-400";
  }
}

export function severityBg(sev: string): string {
  switch (sev) {
    case "critical": return "bg-red-500/10 border-red-500/30";
    case "high": return "bg-orange-500/10 border-orange-500/30";
    case "medium": return "bg-yellow-500/10 border-yellow-500/30";
    case "low": return "bg-green-500/10 border-green-500/30";
    default: return "bg-gray-500/10 border-gray-500/30";
  }
}

export function riskScoreColor(score: number): string {
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 40) return "#eab308";
  return "#22c55e";
}

export const SOLSCAN_TX = "https://solscan.io/tx/";
export const SOLSCAN_ACCOUNT = "https://solscan.io/account/";
