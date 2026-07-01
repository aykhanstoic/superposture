import type { PostureResult } from "@/types";
import { getStatusBgColor } from "@/utils";
import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";

interface PostureFeedbackProps {
  result: PostureResult | null;
}

export function PostureFeedback({ result }: PostureFeedbackProps) {
  const score = result?.score ?? 0;
  const status = result?.status ?? "fair";

  return (
    <Card title="Posture Score" subtitle="Real-time analysis">
      <div className="flex flex-col items-center py-4">
        <ScoreRing score={score} status={status} />
        <div
          className={`mt-4 rounded-xl border px-4 py-2 text-sm font-medium capitalize ${getStatusBgColor(status)}`}
        >
          {status} posture
        </div>
      </div>
    </Card>
  );
}
