"use client";

// Dashboard user.
// Halaman ini menarik ringkasan booking milik user dari backend dan menampilkan statistik cepat.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { RoleGate } from "@/app/components/RoleGate";
import { api } from "@/app/lib/api";
import { useSessionPreferences } from "@/app/lib/use-preferences";
import type { Booking } from "@/app/lib/types";

const dashboardCopy = {
  id: {
    title: "Dashboard",
    subtitle: "Ringkasan booking sekarang diambil langsung dari backend NestJS, bukan dari storage lokal browser.",
    loadError: "Gagal memuat dashboard",
    totalBooking: "Total Booking",
    pending: "Pending",
    inProgress: "Diproses",
    completed: "Completed",
    activity: "Aktivitas Booking",
    activityDesc: "Lihat status terbaru dari booking yang sudah kamu buat.",
    openBookings: "Buka My Bookings",
    queue: "Antrian",
    minutes: "menit",
    empty: "Belum ada booking. Mulai dari halaman rumah sakit.",
    quickActions: "Aksi Cepat",
    createBooking: "Buat booking baru",
    history: "Lihat riwayat booking",
    note: "Swagger dan Postman nanti akan memakai endpoint backend yang sama dengan halaman ini.",
  },
  en: {
    title: "Dashboard",
    subtitle: "Booking summary is now loaded directly from the NestJS backend, not from local browser storage.",
    loadError: "Failed to load dashboard",
    totalBooking: "Total Bookings",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    activity: "Booking Activity",
    activityDesc: "See the latest status from bookings you have created.",
    openBookings: "Open My Bookings",
    queue: "Queue",
    minutes: "minutes",
    empty: "No bookings yet. Start from the hospital page.",
    quickActions: "Quick Actions",
    createBooking: "Create new booking",
    history: "View booking history",
    note: "Swagger and Postman will use the same backend endpoints as this page.",
  },
};

export default function DashboardPage() {
  const { language, darkMode } = useSessionPreferences();
  const copy = dashboardCopy[language];
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Load data dashboard dari endpoint booking user yang sedang login.
      setLoading(true);
      setError(null);

      try {
        const res = await api.getMyBookings();
        if (!mounted) return;
        setItems(res.items);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || copy.loadError);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [copy.loadError]);

  const stats = useMemo(() => {
    const pending = items.filter((item) => item.status === "PENDING").length;
    const inReview = items.filter(
      (item) => item.status === "CONFIRMED" || item.status === "REVIEWED_BY_DOCTOR"
    ).length;
    const completed = items.filter((item) => item.status === "COMPLETED").length;

    return {
      total: items.length,
      pending,
      inReview,
      completed,
    };
  }, [items]);

  return (
    <div className={darkMode ? "min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-slate-50"}>
      <Navbar />
      <RoleGate allow={["admin", "user"]}>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {copy.subtitle}
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: copy.totalBooking, value: stats.total },
              { label: copy.pending, value: stats.pending },
              { label: copy.inProgress, value: stats.inReview },
              { label: copy.completed, value: stats.completed },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-medium text-slate-500">{card.label}</div>
                <div className="mt-2 text-3xl font-black text-slate-950">
                  {loading ? <span className="text-lg font-semibold text-slate-400">...</span> : card.value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{copy.activity}</h2>
                  <p className="mt-1 text-sm text-slate-600">{copy.activityDesc}</p>
                </div>
                <Link
                  href="/my-bookings"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {copy.openBookings}
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {items.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-bold text-slate-900">{item.hospitalName}</div>
                      <div className="text-xs font-semibold text-slate-500">{item.status}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {item.doctorName} · {item.roomName}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {copy.queue} {item.queueNumber} - ETA {item.etaMinutes} {copy.minutes}
                    </div>
                  </div>
                ))}

                {!loading && items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    {copy.empty}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">{copy.quickActions}</h2>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/hospitals"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  {copy.createBooking}
                </Link>
                <Link
                  href="/my-bookings"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  {copy.history}
                </Link>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
                  {copy.note}
                </div>
              </div>
            </div>
          </div>
        </main>
      </RoleGate>
    </div>
  );
}
