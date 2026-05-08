"use client";

// Dashboard dokter untuk melihat booking yang ditugaskan admin
// dan masuk ke halaman review medis.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { RoleGate } from "@/app/components/RoleGate";
import { api } from "@/app/lib/api";
import type { Booking } from "@/app/lib/types";

export default function DoctorPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await api.getBookings();
        if (!mounted) return;
        setItems(res.items);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Gagal memuat dashboard dokter");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const waitingReview = items.filter((item) => item.status === "CONFIRMED").length;
    const reviewed = items.filter((item) => item.status === "REVIEWED_BY_DOCTOR").length;
    const completed = items.filter((item) => item.status === "COMPLETED").length;

    return {
      total: items.length,
      waitingReview,
      reviewed,
      completed,
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <RoleGate allow={["doctor"]}>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Portal Dokter</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Dokter menerima booking dari admin, lalu mengirim balik diagnosis, biaya, resep, dan saran kesehatan.
                </p>
              </div>

              <Link
                href="/doctor/bookings"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Review Booking
              </Link>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Tugas", value: stats.total },
              { label: "Siap Direview", value: stats.waitingReview },
              { label: "Sudah Direview", value: stats.reviewed },
              { label: "Selesai", value: stats.completed },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-medium text-slate-500">{card.label}</div>
                <div className="mt-2 text-3xl font-black text-slate-950">
                  {loading ? <span className="text-lg font-semibold text-slate-400">...</span> : card.value}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Checklist Tugas Dokter</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "Buka booking yang sudah dikirim admin",
                "Isi gejala, diagnosis, estimasi biaya, dan resep",
                "Kirim hasil agar admin bisa menyelesaikan kasus",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </main>
      </RoleGate>
    </div>
  );
}
