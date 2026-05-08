"use client";

// Komponen tombol reusable.
// Semua tombol utama bisa memakai komponen ini agar style dan perilakunya konsisten.
import type { ButtonHTMLAttributes, ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
};

const variantMap = {
  primary:
    "bg-[var(--color-primary)] text-white shadow-[0_20px_45px_-24px_rgba(14,116,144,0.8)] hover:bg-[var(--color-primary-strong)]",
  secondary:
    "border border-[var(--color-border-strong)] bg-white text-[var(--color-foreground)] hover:bg-[var(--color-surface-alt)]",
  ghost: "text-[var(--color-foreground-muted)] hover:bg-white/70 hover:text-[var(--color-foreground)]",
} as const;

const sizeMap = {
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-full font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variantMap[variant],
        sizeMap[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
