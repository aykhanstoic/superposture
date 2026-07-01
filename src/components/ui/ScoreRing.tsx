import type { PostureStatus } from "@/types";
import { getStatusColor } from "@/utils";

interface ScoreRingProps {
  score: number;
  status: PostureStatus;
  size?: number;
}

export function ScoreRing({ score, status, size = 160 }: ScoreRingProps) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const ringColor =
    status === "excellent"
      ? "#22c55e"
      : status === "good"
        ? "#84cc16"
        : status === "fair"
          ? "#eab308"
          : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold tabular-nums text-white">
          {Math.round(score)}
        </span>
        <span className={`text-xs font-medium uppercase tracking-wider ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
