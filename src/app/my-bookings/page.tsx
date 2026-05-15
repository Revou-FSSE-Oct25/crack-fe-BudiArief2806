"use client";

// Halaman booking milik user.
// User melihat riwayat booking sendiri, mengubah status, atau menghapus booking lewat endpoint backend.
import { PaymentSimulationModal } from "@/app/components/PaymentSimulationModal";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import { useToast } from "@/app/components/Toast";
import { api } from "@/app/lib/api";
import { getUser } from "@/app/lib/auth";
import {
  getPaymentSimulation,
  savePendingPaymentSimulation,
  uploadPaymentSimulationProof,
  type PaymentSimulationRecord,
} from "@/app/lib/payment-simulation";
import { bookingStatusLabel, stageLabel, type Booking, type BookingStatus } from "@/app/lib/types";

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fmtDateTime(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg =
    status === "PENDING"
      ? { text: "Pending", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" }
      : status === "CONFIRMED"
      ? { text: "Dikirim ke Dokter", cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" }
      : status === "REVIEWED_BY_DOCTOR"
      ? { text: "Sudah Direview Dokter", cls: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" }
      : { text: "Selesai", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" };

  return (
    <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cfg.cls)}>
      {cfg.text}
    </span>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<Booking[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [paymentDraft, setPaymentDraft] = useState<PaymentSimulationRecord | null>(null);

  async function reload() {
    // Ambil data booking milik user yang sedang login.
    setLoading(true);
    setError("");

    try {
      const res = await api.getMyBookings();
      const list = [...res.items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setItems(list);
    } catch (err: any) {
      const message = err?.message || "Gagal memuat booking";
      setError(message);
      showToast({ tone: "error", title: "Gagal memuat booking", description: message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/signin");
      return;
    }

    setReady(true);
    reload();
  }, [router]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((booking) =>
      `${booking.hospitalName} ${booking.doctorName} ${booking.roomName} ${booking.roomType} ${booking.complaint} ${booking.status} ${booking.specialty}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [items, q]);

  const stats = useMemo(() => {
    const pending = items.filter((booking) => booking.status === "PENDING").length;
    const inReview = items.filter(
      (booking) => booking.status === "CONFIRMED" || booking.status === "REVIEWED_BY_DOCTOR"
    ).length;
    const completed = items.filter((booking) => booking.status === "COMPLETED").length;
    return { pending, inReview, completed, total: items.length };
  }, [items]);

  async function remove(id: string) {
    if (!window.confirm("Hapus booking ini dari sistem?")) {
      return;
    }

    try {
      // Hapus booking lewat backend lalu refresh daftar agar UI selalu sinkron.
      await api.deleteBooking(id);
      showToast({
        tone: "success",
        title: "Booking dihapus",
        description: "Daftar booking sudah diperbarui dari backend.",
      });
      await reload();
    } catch (err: any) {
      const message = err?.message || "Gagal menghapus booking";
      setError(message);
      showToast({ tone: "error", title: "Hapus booking gagal", description: message });
    }
  }

  function openPayment(booking: Booking) {
    // Jika booking belum punya draft pembayaran, buat otomatis dari data booking yang ada.
    setPaymentDraft(getPaymentSimulation(booking.id) || savePendingPaymentSimulation(booking));
  }

  function refreshPaymentStatus() {
    if (!paymentDraft) return;
    setPaymentDraft(getPaymentSimulation(paymentDraft.bookingId));
  }

  function uploadProof(booking: Booking, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      uploadPaymentSimulationProof(booking.id, result);
      setItems((current) => [...current]);
      showToast({
        tone: "success",
        title: "Bukti bayar terkirim",
        description: "Admin sekarang bisa melihat gambar bukti bayar dari browser ini.",
      });
    };

    reader.readAsDataURL(file);
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <PaymentSimulationModal
        open={Boolean(paymentDraft)}
        title="Pembayaran Simulasi QR"
        subtitle="Gunakan QR ini sebagai simulasi pembayaran, lalu unggah bukti agar admin bisa memverifikasi booking Anda."
        pendingText={
          paymentDraft?.status === "verified"
            ? "Sudah diverifikasi admin"
            : paymentDraft?.status === "proof_uploaded"
            ? "Bukti menunggu verifikasi admin"
            : "Menunggu bukti pembayaran"
        }
        confirmText={paymentDraft?.status === "verified" ? "Sudah terkonfirmasi" : "Refresh status"}
        laterText="Tutup"
        summaryLabels={{
          hospital: "Rumah sakit",
          doctor: "Dokter",
          room: "Ruangan",
          total: "Total simulasi",
        }}
        payment={paymentDraft}
        onClose={() => setPaymentDraft(null)}
        onConfirm={refreshPaymentStatus}
      />

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/40 via-cyan-200/30 to-sky-200/40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                DIABSTROK
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                My Booking
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">My Booking</h1>
              <p className="mt-2 text-sm text-slate-600">
                Pending: {stats.pending} - Diproses: {stats.inReview} - Completed: {stats.completed}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => router.push("/hospitals")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Booking Baru
              </button>

              <button
                onClick={() => reload()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari RS, dokter, ruangan, keluhan, status"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              Memuat booking dari backend...
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            {!loading && filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
                <div className="text-sm font-semibold text-slate-700">Belum ada booking</div>
                <div className="mt-1 text-xs text-slate-500">Buat booking dari halaman Daftar Rumah Sakit</div>
              </div>
            ) : null}

            {filtered.map((booking) => (
              <div key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-extrabold text-slate-900">{booking.hospitalName}</div>
                      <StatusBadge status={booking.status} />
                      {booking.prescription ? (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
                          Resep tersedia
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {fmtDateTime(booking.createdAt)} - Antrian {booking.queueNumber} - Estimasi {booking.etaMinutes} menit
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                      Status: {bookingStatusLabel(booking.status)}
                    </div>

                    {(() => {
                      const payment = getPaymentSimulation(booking.id);
                      if (!payment) return null;

                      return (
                        <div
                          className={cls(
                            "rounded-xl px-3 py-2 text-xs font-semibold",
                            payment.status === "verified"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : payment.status === "proof_uploaded"
                              ? "border border-cyan-200 bg-cyan-50 text-cyan-700"
                              : "border border-violet-200 bg-violet-50 text-violet-700"
                          )}
                        >
                          {payment.status === "verified"
                            ? "Pembayaran Diverifikasi Admin"
                            : payment.status === "proof_uploaded"
                            ? "Bukti Bayar Menunggu Verifikasi"
                            : "Menunggu Bukti Pembayaran"}
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => remove(booking.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">Dokter</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{booking.doctorName}</div>
                    <div className="mt-1 text-xs text-slate-600">{booking.specialty}</div>
                  </div>

                  <div className="sm:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">Ruangan</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{booking.roomName}</div>
                    <div className="mt-1 text-xs text-slate-600">{booking.roomType}</div>
                  </div>

                  <div className="sm:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">ID Booking</div>
                    <div className="mt-1 break-all text-xs font-semibold text-slate-700">{booking.id}</div>
                    <div className="mt-2 text-xs text-slate-500">RS: {booking.hospitalId}</div>
                  </div>

                  <div className="sm:col-span-12 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">Keluhan singkat</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">{booking.complaint}</div>
                  </div>

                  <div className="sm:col-span-12 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">Pembayaran Simulasi</div>
                        <div className="mt-1 text-sm text-slate-700">
                          {getPaymentSimulation(booking.id)?.status === "verified"
                            ? "Pembayaran sudah diverifikasi admin dan booking bisa diteruskan ke dokter."
                            : getPaymentSimulation(booking.id)?.status === "proof_uploaded"
                            ? "Bukti pembayaran sudah terkirim. Menunggu verifikasi admin."
                            : "Upload foto bukti bayar agar admin bisa meneruskan booking ke dokter."}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openPayment(booking)}
                          className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                        >
                          {getPaymentSimulation(booking.id)?.status === "verified" ? "Lihat pembayaran" : "Buka QR pembayaran"}
                        </button>
                        <label className="cursor-pointer rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100">
                          Upload bukti bayar
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                uploadProof(booking, file);
                              }
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    {getPaymentSimulation(booking.id)?.proofImage ? (
                      <div className="mt-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Preview bukti bayar</div>
                        {/* Bukti disimpan di browser agar demo terasa seperti alur pembayaran nyata. */}
                        <img
                          src={getPaymentSimulation(booking.id)?.proofImage}
                          alt="Bukti bayar booking"
                          className="mt-2 h-40 rounded-2xl border border-slate-200 bg-white object-cover"
                        />
                      </div>
                    ) : null}
                  </div>

                  {booking.prescription ? (
                    <div className="sm:col-span-12 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-indigo-800">Resep Obat</div>
                        <div className="text-xs text-indigo-700">{stageLabel(booking.prescription.stage)}</div>
                      </div>

                      <div className="mt-2 grid gap-2 text-sm text-slate-800">
                        {booking.prescription.items.map((item, index) => (
                          <div
                            key={`${booking.id}_rx_${index}`}
                            className="rounded-xl border border-indigo-100 bg-white px-3 py-2"
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      {booking.prescription.notes ? (
                        <div className="mt-3 text-xs text-slate-700">
                          Catatan: <span className="font-semibold">{booking.prescription.notes}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {booking.doctorReview ? (
                    <div className="sm:col-span-12 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-cyan-800">Ringkasan Hasil Dokter</div>
                        <div className="text-xs text-cyan-700">
                          Estimasi biaya Rp {booking.doctorReview.estimatedCost.toLocaleString("id-ID")}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-cyan-100 bg-white p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">Diagnosis</div>
                          <div className="mt-1 text-sm font-semibold text-slate-800">{booking.doctorReview.diagnosis}</div>
                        </div>
                        <div className="rounded-xl border border-cyan-100 bg-white p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">Saran kesehatan</div>
                          <div className="mt-1 text-sm text-slate-800">{booking.doctorReview.healthAdvice}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-xs text-slate-500">(c) 2026 Diabstrok</div>
        </div>
      </div>
    </div>
  );
}
