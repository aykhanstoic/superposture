import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-elevated bg-gradient-to-b from-white/[0.03] to-transparent p-5 shadow-lg shadow-black/20 animate-slide-up">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">
          {label}
        </span>
        <span className="text-white/30">{icon}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}
