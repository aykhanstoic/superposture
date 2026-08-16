import type { PostureStatus } from "@/types";
import { getStatusColor } from "@/utils";

interface ScoreRingProps {
  /** null = no measurement yet (starting up, calibrating, nobody in view). */
  score: number | null;
  status: PostureStatus;
  size?: number;
}

const STATUS_RING_COLORS: Record<PostureStatus, string> = {
  excellent: "#22c55e",
  good: "#84cc16",
  fair: "#eab308",
  poor: "#ef4444",
};

export function ScoreRing({ score, status, size = 190 }: ScoreRingProps) {
  const stroke = 10;
  const radius = (size - stroke - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const hasScore = score !== null;
  const offset = hasScore
    ? circumference - (score / 100) * circumference
    : circumference;

  const ringColor = STATUS_RING_COLORS[status];

  // Small marker at score 50 — the reminder threshold, visible at a glance.
  const markerAngle = Math.PI / 2; // ring starts at -90°; 50% around = bottom
  const markerX = size / 2 + radius * Math.cos(markerAngle);
  const markerY = size / 2 + radius * Math.sin(markerAngle);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        {hasScore && (
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
            style={{ filter: `drop-shadow(0 0 10px ${ringColor}55)` }}
          />
        )}
        <circle
          cx={markerX}
          cy={markerY}
          r={2.5}
          fill="rgba(255,255,255,0.35)"
        >
          <title>Reminders fire below 50</title>
        </circle>
      </svg>
      <div className="absolute flex flex-col items-center">
        {hasScore ? (
          <>
            <span className="text-5xl font-bold tabular-nums tracking-tight text-white">
              {Math.round(score)}
            </span>
            <span
              className={`mt-1 text-xs font-medium uppercase tracking-wider ${getStatusColor(status)}`}
            >
              {status}
            </span>
          </>
        ) : (
          <>
            <span className="text-5xl font-bold text-white/25">—</span>
            <span className="mt-1 text-xs font-medium uppercase tracking-wider text-white/30">
              waiting
            </span>
          </>
        )}
      </div>
    </div>
  );
}
