import { riskScoreColor } from "../lib/utils";

export default function RiskGauge({ score }: { score: number }) {
  const color = riskScoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="#1f2937"
          strokeWidth="8"
        />
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span
        className="absolute text-2xl font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}
