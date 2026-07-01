import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { getDashboardData } from "@/database/db";
import type { DashboardData } from "@/types";
import { formatDuration } from "@/utils";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { TrendChart } from "@/components/dashboard/TrendChart";

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    getDashboardData().then(setData);
    const interval = setInterval(() => getDashboardData().then(setData), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-white/40">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Monitoring"
          value={formatDuration(data.todayMonitoringSeconds)}
          icon="⏱"
        />
        <StatCard
          label="Average Score"
          value={Math.round(data.todayAvgScore).toString()}
          icon="📊"
        />
        <StatCard
          label="Best Good Streak"
          value={formatDuration(data.longestGoodStreakSeconds)}
          icon="🔥"
        />
        <StatCard
          label="Reminders Today"
          value={data.todayReminderCount.toString()}
          icon="🔔"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Weekly Trend" subtitle="Average posture score per day">
          <TrendChart
            data={data.weeklyTrend.map((d) => ({
              label: format(parseISO(d.date), "EEE"),
              score: d.avgScore,
            }))}
          />
        </Card>
        <Card title="Monthly Trend" subtitle="Score snapshots over 30 days">
          <TrendChart
            data={data.monthlyTrend.map((d) => ({
              label: format(parseISO(d.date), "MMM d"),
              score: d.avgScore,
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
