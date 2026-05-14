"use client";

import Image from "next/image";
import type { PaymentSimulationRecord } from "@/app/lib/payment-simulation";

type PaymentSimulationModalProps = {
  open: boolean;
  title: string;
  subtitle: string;
  pendingText: string;
  confirmText: string;
  laterText: string;
  summaryLabels: {
    hospital: string;
    doctor: string;
    room: string;
    total: string;
  };
  payment?: PaymentSimulationRecord | null;
  onClose: () => void;
  onConfirm: () => void;
};

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function PaymentSimulationModal({
  open,
  title,
  subtitle,
  pendingText,
  confirmText,
  laterText,
  summaryLabels,
  payment,
  onClose,
  onConfirm,
}: PaymentSimulationModalProps) {
  if (!open || !payment) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white p-6 shadow-[0_36px_120px_-48px_rgba(15,23,42,0.65)]">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.6rem] bg-slate-950 p-5 text-white">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-200">{pendingText}</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>

            <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white p-4">
              <div className="relative mx-auto aspect-square w-full max-w-[280px]">
                <Image src="/qr/payment.png" alt="QR pembayaran simulasi" fill className="object-contain" />
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{summaryLabels.hospital}</div>
                <div className="mt-2 text-sm font-bold text-slate-900">{payment.hospitalName}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{summaryLabels.doctor}</div>
                <div className="mt-2 text-sm font-bold text-slate-900">{payment.doctorName}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{summaryLabels.room}</div>
                <div className="mt-2 text-sm font-bold text-slate-900">{payment.roomName}</div>
              </div>
              <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{summaryLabels.total}</div>
                <div className="mt-2 text-2xl font-black text-slate-950">Rp {payment.amount.toLocaleString("id-ID")}</div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onConfirm}
                className={cls(
                  "h-12 flex-1 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white transition hover:bg-violet-500",
                  "shadow-[0_20px_45px_-24px_rgba(124,58,237,0.65)]"
                )}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {laterText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
