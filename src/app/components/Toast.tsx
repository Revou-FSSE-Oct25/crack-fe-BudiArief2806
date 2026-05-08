"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = Omit<ToastItem, "id">;

const toneMap: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

const ToastContext = createContext<{
  showToast: (toast: ToastInput) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      setItems((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 3400);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] mx-auto flex max-w-md flex-col gap-3 sm:right-4 sm:left-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-3xl border px-4 py-3 shadow-[0_22px_55px_-30px_rgba(15,23,42,0.4)] ${toneMap[item.tone]}`}
          >
            <div className="text-sm font-bold">{item.title}</div>
            {item.description ? <div className="mt-1 text-xs opacity-80">{item.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
