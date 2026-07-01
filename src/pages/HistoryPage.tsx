import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { getDailyHistory, getRecentSessions } from "@/database/db";
import type { DailyStats, SessionRecord } from "@/types";
import { formatDuration } from "@/utils";
import { Card } from "@/components/ui/Card";

export function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [daily, setDaily] = useState<DailyStats[]>([]);

  useEffect(() => {
    getRecentSessions().then(setSessions);
    getDailyHistory().then(setDaily);
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-2 animate-fade-in">
      <Card title="Recent Sessions" subtitle="Stored locally on your device">
        {sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">
            No sessions recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-surface-border bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {format(parseISO(s.start_time), "MMM d, h:mm a")}
                  </p>
                  <p className="text-xs text-white/40">
                    {formatDuration(s.duration_seconds)} · {s.reminder_count}{" "}
                    reminders
                  </p>
                </div>
                <span className="text-lg font-semibold tabular-nums text-accent">
                  {Math.round(s.avg_score)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Daily History" subtitle="Last 30 days">
        {daily.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">
            No daily stats yet.
          </p>
        ) : (
          <div className="space-y-2">
            {daily.map((d) => (
              <div
                key={d.date}
                className="flex items-center justify-between rounded-xl border border-surface-border bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {format(parseISO(d.date), "EEEE, MMM d")}
                  </p>
                  <p className="text-xs text-white/40">
                    {formatDuration(d.monitoring_seconds)} monitored
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold tabular-nums text-accent">
                    {Math.round(d.avg_score)}
                  </span>
                  <p className="text-xs text-white/40">
                    {d.reminder_count} reminders
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
