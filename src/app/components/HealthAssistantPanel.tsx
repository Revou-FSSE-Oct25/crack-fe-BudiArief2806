"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/app/lib/api";
import type { HealthAssistantMessage } from "@/app/lib/types";
import { useToast } from "./Toast";

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const assistantCopy = {
  id: {
    title: "Health Q&A Assistant",
    subtitle:
      "Asisten edukasi ini membantu user memahami informasi dasar tentang diabetes dan stroke sebelum atau sesudah booking.",
    disclaimer:
      "Jawaban bersifat edukasi umum dan bukan pengganti diagnosis dokter. Jika gejala berat, segera hubungi rumah sakit atau IGD.",
    loading: "Memuat riwayat percakapan...",
    empty: "Belum ada percakapan. Tanyakan hal ringan seputar diabetes, stroke, pola makan, atau tanda bahaya.",
    placeholder: "Contoh: Apa gejala awal stroke? Makanan apa yang baik untuk penderita diabetes?",
    send: "Kirim Pertanyaan",
    sending: "Mengirim...",
    loadErrorTitle: "Chatbot gagal dimuat",
    loadErrorDescription: "Riwayat percakapan edukasi belum bisa diambil dari backend.",
    sendErrorTitle: "Pesan gagal dikirim",
    sendErrorDescription: "Pertanyaan belum berhasil diproses oleh chatbot edukasi.",
    assistantLabel: "Asisten Edukasi",
    userLabel: "Anda",
  },
  en: {
    title: "Health Q&A Assistant",
    subtitle:
      "This educational assistant helps users understand basic diabetes and stroke information before or after booking.",
    disclaimer:
      "Answers are for general education only and do not replace a doctor's diagnosis. For serious symptoms, contact the hospital or emergency unit immediately.",
    loading: "Loading conversation history...",
    empty: "No conversation yet. Ask simple questions about diabetes, stroke, diet, or warning signs.",
    placeholder: "Example: What are early stroke symptoms? What foods are good for diabetes patients?",
    send: "Send Question",
    sending: "Sending...",
    loadErrorTitle: "Chatbot failed to load",
    loadErrorDescription: "Educational conversation history could not be loaded from the backend.",
    sendErrorTitle: "Message failed to send",
    sendErrorDescription: "Your question could not be processed by the educational chatbot.",
    assistantLabel: "Education Assistant",
    userLabel: "You",
  },
};

export function HealthAssistantPanel({ language }: { language: "id" | "en" }) {
  const copy = assistantCopy[language];
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<HealthAssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      setLoading(true);

      try {
        const response = await api.getHealthAssistantMessages();
        if (!mounted) return;
        setMessages(response.items);
      } catch (error: any) {
        if (!mounted) return;
        showToast({
          tone: "error",
          title: copy.loadErrorTitle,
          description: error?.message || copy.loadErrorDescription,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadMessages();

    return () => {
      mounted = false;
    };
  }, [copy.loadErrorDescription, copy.loadErrorTitle, showToast]);

  const sortedMessages = useMemo(
    () => [...messages].sort((left, right) => (left.createdAt > right.createdAt ? 1 : -1)),
    [messages]
  );

  async function submitQuestion() {
    const message = draft.trim();
    if (!message) return;

    setSending(true);
    try {
      const response = await api.askHealthAssistant({ message });
      setMessages((current) => [...current, response.userMessage, response.assistantMessage]);
      setDraft("");
    } catch (error: any) {
      showToast({
        tone: "error",
        title: copy.sendErrorTitle,
        description: error?.message || copy.sendErrorDescription,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{copy.title}</h2>
        <p className="text-sm text-slate-600">{copy.subtitle}</p>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          {copy.disclaimer}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
          {loading ? (
            <div className="text-sm text-slate-500">{copy.loading}</div>
          ) : sortedMessages.length === 0 ? (
            <div className="text-sm text-slate-500">{copy.empty}</div>
          ) : (
            sortedMessages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div key={message.id} className={cls("flex", isUser ? "justify-end" : "justify-start")}>
                  <div
                    className={cls(
                      "max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                      isUser
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800"
                    )}
                  >
                    <div className={cls("text-[11px] font-semibold", isUser ? "text-indigo-100" : "text-slate-500")}>
                      {isUser ? copy.userLabel : copy.assistantLabel}
                      {message.topic ? ` · ${message.topic}` : ""}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap leading-6">{message.message}</div>
                    <div className={cls("mt-2 text-[10px]", isUser ? "text-indigo-100/80" : "text-slate-400")}>
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            placeholder={copy.placeholder}
            className="min-h-[108px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            disabled={sending || !draft.trim()}
            onClick={() => void submitQuestion()}
            className={cls(
              "rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
              sending || !draft.trim() ? "bg-indigo-300" : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            {sending ? copy.sending : copy.send}
          </button>
        </div>
      </div>
    </section>
  );
}
