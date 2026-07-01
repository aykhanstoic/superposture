import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/20",
  secondary:
    "bg-white/5 text-white/80 hover:bg-white/10 border border-surface-border",
  ghost: "text-white/60 hover:text-white/90 hover:bg-white/5",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
