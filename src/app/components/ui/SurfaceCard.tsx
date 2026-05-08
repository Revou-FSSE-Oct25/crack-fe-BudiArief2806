// Komponen card reusable untuk membungkus section UI dengan tampilan permukaan yang konsisten.
import type { HTMLAttributes, ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SurfaceCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function SurfaceCard({ children, className, ...props }: SurfaceCardProps) {
  return (
    <div
      className={cx(
        "rounded-[1.75rem] border border-[var(--color-border)] bg-white/88 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)] backdrop-blur",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
