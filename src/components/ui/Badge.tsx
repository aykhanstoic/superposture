import type { IssueSeverity } from "@/types";
import { capitalize } from "@/utils";

interface BadgeProps {
  severity: IssueSeverity;
}

const colors: Record<IssueSeverity, string> = {
  low: "bg-score-good/15 text-score-good border-score-good/30",
  medium: "bg-score-fair/15 text-score-fair border-score-fair/30",
  high: "bg-score-poor/15 text-score-poor border-score-poor/30",
};

export function SeverityBadge({ severity }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${colors[severity]}`}
    >
      {capitalize(severity)}
    </span>
  );
}
