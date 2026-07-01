interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-elevated p-5 animate-slide-up">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}
