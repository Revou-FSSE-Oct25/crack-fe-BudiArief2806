"use client";

// Halaman operasional admin untuk mengirim booking ke dokter,
// memantau hasil review dokter, lalu menutup kasus.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGate } from "@/app/components/RoleGate";
import { useToast } from "@/app/components/Toast";
import { api } from "@/app/lib/api";
import { type Booking, type BookingStatus } from "@/app/lib/types";

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
      ? { text: "Pending Triage Admin", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" }
      : status === "CONFIRMED"
      ? { text: "Sudah Dikirim ke Dokter", cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" }
      : status === "REVIEWED_BY_DOCTOR"
      ? { text: "Hasil Dokter Masuk", cls: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" }
      : { text: "Selesai", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" };

  return (
    <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cfg.cls)}>
      {cfg.text}
    </span>
  );
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<Booking[]>([]);
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    setError("");

    try {
      const res = await api.getBookings();
      const list = [...res.items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setItems(list);
    } catch (err: any) {
      const message = err?.message || "Gagal memuat booking admin";
      setError(message);
      showToast({ tone: "error", title: "Gagal memuat data admin", description: message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setReady(true);
    reload();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((booking) =>
      [
        booking.userName,
        booking.userEmail,
        booking.complaint,
        booking.doctorName,
        booking.hospitalName,
        booking.roomName,
        booking.status,
        booking.doctorReview?.diagnosis,
        booking.doctorReview?.healthAdvice,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [items, q]);

  async function setStatus(id: string, status: BookingStatus) {
    try {
      await api.updateBookingStatus(id, { status });
      showToast({
        tone: "success",
        title: "Status booking diperbarui",
        description:
          status === "CONFIRMED"
            ? "Booking sudah dikirim ke dokter yang dipilih."
            : status === "COMPLETED"
            ? "Kasus sudah ditutup oleh admin."
            : `Status terbaru: ${status}.`,
      });
      await reload();
    } catch (err: any) {
      const message = err?.message || "Gagal mengubah status booking";
      setError(message);
      showToast({ tone: "error", title: "Update status gagal", description: message });
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus booking ini dari panel admin?")) {
      return;
    }

    try {
      await api.deleteBooking(id);
      showToast({
        tone: "success",
        title: "Booking dihapus",
        description: "Data booking sudah dihapus dari backend.",
      });
      await reload();
    } catch (err: any) {
      const message = err?.message || "Gagal menghapus booking";
      setError(message);
      showToast({ tone: "error", title: "Hapus booking gagal", description: message });
    }
  }

  if (!ready) return null;

  const pendingCount = items.filter((item) => item.status === "PENDING").length;
  const sentCount = items.filter((item) => item.status === "CONFIRMED").length;
  const reviewedCount = items.filter((item) => item.status === "REVIEWED_BY_DOCTOR").length;

  return (
    <RoleGate allow={["admin"]}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Admin Booking Rumah Sakit</h1>
              <p className="mt-1 text-sm text-slate-600">
                Admin menilai keluhan awal, mengirim booking ke dokter, lalu menutup kasus setelah hasil dokter masuk.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => reload()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>

              <button
                onClick={() => router.push("/admin")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kembali
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Total booking</div>
              <div className="mt-1 text-2xl font-extrabold">{items.length}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Pending triage</div>
              <div className="mt-1 text-2xl font-extrabold">{pendingCount}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Menunggu dan selesai review dokter</div>
              <div className="mt-1 text-2xl font-extrabold">{sentCount + reviewedCount}</div>
            </div>
          </div>

          <div className="mt-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, email, dokter, RS, keluhan, status, diagnosis"
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
                <div className="mt-1 text-xs text-slate-500">Coba buat booking dari halaman `/hospitals`</div>
              </div>
            ) : null}

            {filtered.map((booking) => {
              const canSendToDoctor = booking.status === "PENDING";
              const canComplete = booking.status === "REVIEWED_BY_DOCTOR";

              return (
                <div key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-extrabold text-slate-900">
                          {booking.hospitalName} - {booking.doctorName}
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Dibuat: {fmtDateTime(booking.createdAt)} - Antrian: {booking.queueNumber} - ETA: {booking.etaMinutes} menit
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canSendToDoctor ? (
                        <button
                          onClick={() => setStatus(booking.id, "CONFIRMED")}
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          Kirim ke Dokter
                        </button>
                      ) : null}

                      {canComplete ? (
                        <button
                          onClick={() => setStatus(booking.id, "COMPLETED")}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Selesaikan Kasus
                        </button>
                      ) : null}

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
                      <div className="text-xs font-semibold text-slate-500">Pasien</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{booking.userName}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {booking.patientAge ? `Umur ${booking.patientAge} tahun` : booking.userEmail || "Didaftarkan admin tanpa email"}
                      </div>
                    </div>

                    <div className="sm:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Ruangan</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{booking.roomName}</div>
                      <div className="mt-1 text-xs text-slate-600">{booking.roomType}</div>
                    </div>

                    <div className="sm:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Spesialis</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{booking.specialty}</div>
                      <div className="mt-1 text-xs text-slate-600">ID: {booking.id}</div>
                    </div>

                    <div className="sm:col-span-12 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Keluhan singkat</div>
                      <div className="mt-1 text-sm font-semibold text-slate-800">{booking.complaint}</div>
                    </div>

                    {!booking.doctorReview ? (
                      <div className="sm:col-span-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        {booking.status === "PENDING"
                          ? "Admin belum mengirim booking ini ke dokter."
                          : booking.status === "CONFIRMED"
                          ? "Booking sudah dikirim ke dokter. Menunggu hasil pemeriksaan."
                          : "Belum ada hasil review dokter."}
                      </div>
                    ) : (
                      <>
                        <div className="sm:col-span-6 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                          <div className="text-xs font-semibold text-cyan-800">Gejala yang diamati dokter</div>
                          <div className="mt-2 text-sm text-slate-800">{booking.doctorReview.symptoms}</div>
                        </div>

                        <div className="sm:col-span-6 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                          <div className="text-xs font-semibold text-cyan-800">Diagnosis dan estimasi biaya</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{booking.doctorReview.diagnosis}</div>
                          <div className="mt-1 text-sm text-slate-700">
                            Estimasi biaya: Rp {booking.doctorReview.estimatedCost.toLocaleString("id-ID")}
                          </div>
                        </div>

                        <div className="sm:col-span-12 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                          <div className="text-xs font-semibold text-cyan-800">Saran menjaga kesehatan</div>
                          <div className="mt-2 text-sm text-slate-800">{booking.doctorReview.healthAdvice}</div>
                        </div>
                      </>
                    )}

                    {booking.prescription ? (
                      <div className="sm:col-span-12 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-indigo-800">Resep dari Dokter</div>
                          <div className="text-xs text-indigo-700">Dibuat oleh {booking.prescription.createdBy}</div>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-800">
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
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center text-xs text-slate-500">(c) 2026 Diabstrok</div>
        </div>
      </div>
    </RoleGate>
  );
}
