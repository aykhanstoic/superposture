import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Card({ children, className = "", title, subtitle }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-surface-elevated bg-gradient-to-b from-white/[0.03] to-transparent p-5 shadow-lg shadow-black/20 animate-slide-up ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs text-white/50">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
