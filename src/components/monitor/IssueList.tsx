import type { PostureIssue } from "@/types";
import { Card } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/Badge";

interface IssueListProps {
  issues: PostureIssue[];
}

export function IssueList({ issues }: IssueListProps) {
  return (
    <Card title="Detected Issues" subtitle="Confidence-based analysis">
      {issues.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-2xl">✓</p>
          <p className="mt-2 text-sm text-white/50">No issues detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.type}
              className="flex items-center justify-between rounded-xl border border-surface-border bg-white/[0.02] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white/90">{issue.label}</p>
                <p className="text-xs text-white/40">
                  Confidence: {Math.round(issue.confidence * 100)}%
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
