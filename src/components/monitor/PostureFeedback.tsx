import type { PostureResult } from "@/types";
import { formatDuration } from "@/utils";
import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { IconFlame, IconTimer } from "@/components/ui/icons";
import { usePostureStore } from "@/store/postureStore";

interface PostureFeedbackProps {
  result: PostureResult | null;
  calibrating: boolean;
}

function SessionStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-white/40">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-white/90">
        {value}
      </span>
    </div>
  );
}

export function PostureFeedback({ result, calibrating }: PostureFeedbackProps) {
  const monitoringSeconds = usePostureStore((s) => s.monitoringSeconds);
  const goodStreakSeconds = usePostureStore((s) => s.goodStreakSeconds);

  // A judgment during calibration would be premature — hold the ring empty
  // until the analyzer has learned this user's upright posture.
  const showScore = result !== null && !calibrating;

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center py-2">
        <ScoreRing
          score={showScore ? result.score : null}
          status={result?.status ?? "fair"}
        />
        <p className="mt-4 max-w-[220px] text-center text-xs leading-relaxed text-white/40">
          {calibrating
            ? "Learning your upright posture — sit comfortably for a few seconds."
            : "You'll get a gentle nudge when your score stays below 50."}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <SessionStat
          icon={<IconTimer size={13} />}
          label="Session"
          value={formatDuration(monitoringSeconds)}
        />
        <SessionStat
          icon={<IconFlame size={13} />}
          label="Good streak"
          value={formatDuration(goodStreakSeconds)}
        />
      </div>
    </Card>
  );
}
