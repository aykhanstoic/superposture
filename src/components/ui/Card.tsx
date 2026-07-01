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
      className={`rounded-2xl border border-surface-border bg-surface-elevated p-5 shadow-sm animate-slide-up ${className}`}
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
