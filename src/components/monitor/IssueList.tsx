import type { PostureIssue } from "@/types";
import { ISSUE_TIPS } from "@/types";
import { Card } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/Badge";
import { IconCheck } from "@/components/ui/icons";

interface IssueListProps {
  issues: PostureIssue[];
  calibrating: boolean;
  hasResult: boolean;
}

export function IssueList({ issues, calibrating, hasResult }: IssueListProps) {
  return (
    <Card title="Posture coach" subtitle="What to adjust right now">
      {calibrating || !hasResult ? (
        <p className="py-6 text-center text-sm text-white/40">
          {calibrating && hasResult
            ? "Calibrating — sit the way you'd like to sit."
            : "Waiting for the camera to see you."}
        </p>
      ) : issues.length === 0 ? (
        <div className="flex items-center justify-center gap-2.5 py-6 text-score-excellent">
          <IconCheck size={18} />
          <p className="text-sm font-medium">
            Posture looks good — nothing to fix.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {issues.map((issue) => (
            <div
              key={issue.type}
              className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white/90">
                  {issue.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/45">
                  {ISSUE_TIPS[issue.type]}
                </p>
              </div>
              <SeverityBadge severity={issue.severity} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
