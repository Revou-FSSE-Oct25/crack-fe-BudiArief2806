"use client";

// Komponen input reusable.
// Label, hint, dan error dikemas dalam satu komponen agar form lebih mudah dibaca dan dirawat.
import { forwardRef, type InputHTMLAttributes } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, error, hint, className, id, ...props },
  ref
) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={inputId} className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--color-foreground)]">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={cx(
          "h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-cyan-100",
          error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-[var(--color-foreground-soft)]">{hint}</span> : null}
    </label>
  );
});
