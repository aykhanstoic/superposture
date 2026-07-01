import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-white/80">
          {label}
        </span>
      )}
      <select
        className={`w-full rounded-xl border border-surface-border bg-white/5 px-3 py-2.5 text-sm text-white/90 outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-zinc-900">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
