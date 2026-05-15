"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/app/lib/api";
import { getUser } from "@/app/lib/auth";
import { subscribeBookingRealtime } from "@/app/lib/realtime";
import type { Booking, BookingMessage } from "@/app/lib/types";
import { useToast } from "./Toast";

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fmtTime(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

const roleLabel: Record<string, string> = {
  admin: "Admin",
  doctor: "Dokter",
  user: "Pasien",
};

export function BookingChatPanel({
  booking,
  title = "Percakapan Kasus",
}: {
  booking: Booking;
  title?: string;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const currentUserId = getUser()?.id ?? "";

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await api.getBookingMessages(booking.id);
      setMessages(res.items);
    } catch (err: any) {
      showToast({
        tone: "error",
        title: "Chat gagal dimuat",
        description: err?.message || "Gagal mengambil percakapan booking",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void loadMessages();
  }, [open, booking.id]);

  useEffect(() => {
    if (!open) return;

    return subscribeBookingRealtime((event) => {
      if (event.type !== "booking.message.created") return;
      if (event.bookingId !== booking.id) return;

      setMessages((current) => {
        if (current.some((item) => item.id === event.message.id)) {
          return current;
        }

        return [...current, event.message];
      });
    });
  }, [open, booking.id]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)),
    [messages]
  );

  async function submitMessage() {
    const message = draft.trim();
    if (!message) return;

    setSending(true);
    try {
      const res = await api.createBookingMessage(booking.id, { message });
      setMessages((current) => {
        if (current.some((item) => item.id === res.item.id)) {
          return current;
        }

        return [...current, res.item];
      });
      setDraft("");
    } catch (err: any) {
      showToast({
        tone: "error",
        title: "Pesan gagal dikirim",
        description: err?.message || "Gagal mengirim pesan booking",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
          <div className="mt-1 text-sm text-slate-600">
            Gunakan percakapan ini untuk koordinasi antara pasien, admin, dan dokter pada booking yang sama.
          </div>
        </div>

        <button
          onClick={() => setOpen((current) => !current)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          {open ? "Tutup Chat" : "Buka Chat"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3">
            {loading ? (
              <div className="text-sm text-slate-500">Memuat percakapan...</div>
            ) : sortedMessages.length === 0 ? (
              <div className="text-sm text-slate-500">Belum ada pesan. Mulai percakapan dari booking ini.</div>
            ) : (
              sortedMessages.map((message) => {
                const mine = message.senderUserId === currentUserId;
                const sender = roleLabel[message.senderRole] || message.senderRole;

                return (
                  <div key={message.id} className={cls("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cls(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                        mine
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-800"
                      )}
                    >
                      <div className={cls("text-[11px] font-semibold", mine ? "text-indigo-100" : "text-slate-500")}>
                        {message.senderName} - {sender}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap">{message.message}</div>
                      <div className={cls("mt-2 text-[10px]", mine ? "text-indigo-100/80" : "text-slate-400")}>
                        {fmtTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder="Tulis pesan untuk booking ini..."
              className="min-h-[88px] flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={() => void submitMessage()}
              disabled={sending || !draft.trim()}
              className={cls(
                "rounded-2xl px-4 py-3 text-sm font-bold text-white sm:w-40",
                sending || !draft.trim() ? "bg-indigo-300" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {sending ? "Mengirim..." : "Kirim Pesan"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
