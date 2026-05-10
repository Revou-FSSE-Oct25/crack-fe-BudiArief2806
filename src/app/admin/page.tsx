"use client";

// Dashboard admin dengan gaya panel kerja khusus.
// Halaman ini hanya untuk admin dan tetap menampilkan rumah sakit, dokter, serta ringkasan operasional.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/app/components/RoleGate";
import { clearSession, getUser } from "@/app/lib/auth";
import { api } from "@/app/lib/api";
import type { Booking, DoctorRecord, HospitalRecord, User } from "@/app/lib/types";

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDateLabel(value: Date) {
  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTimeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function parseMedicinePrice(line: string) {
  const match = line.match(/Rp\s?([\d.]+)/i);
  if (!match) return 0;
  return Number(match[1].replace(/\./g, ""));
}

function medicineNameOnly(line: string) {
  return line.replace(/\s+-\s+Rp.*$/i, "").trim();
}

function DashboardIcon({ name, active = false }: { name: string; active?: boolean }) {
  const stroke = active ? "#7c3aed" : "#94a3b8";

  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M4 10.5 12 4l8 6.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 9.5V20h10V9.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "hospital") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M6 20V5h12v15" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 8h4M10 12h4M12 5v10M9 20v-3h6v3" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "doctor") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.25" stroke={stroke} strokeWidth="1.8" />
        <path d="M6.5 19c1.2-2.9 3.1-4.4 5.5-4.4 2.4 0 4.3 1.5 5.5 4.4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "patient") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="12" cy="7.5" r="3" stroke={stroke} strokeWidth="1.8" />
        <path d="M7.5 19c1-2.6 2.8-4 4.5-4s3.5 1.4 4.5 4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "report") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path d="M7 4h8l3 3v13H7z" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 4v4h4M10 12h4M10 16h4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "schedule") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <rect x="5" y="6" width="14" height="13" rx="2.2" stroke={stroke} strokeWidth="1.8" />
        <path d="M8 4v4M16 4v4M5 10h14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type MenuItem = {
  label: string;
  href: string;
  icon: string;
  view?: "dashboard" | "reports";
};

type MetricCard = {
  label: string;
  value: string;
  hint: string;
  accent: string;
  bubble: string;
};

function ReportIcon({ tone, kind }: { tone: "violet" | "blue" | "green" | "amber"; kind: "wallet" | "cart" | "trend" | "bag" | "bottle" }) {
  const toneClass = {
    violet: "bg-violet-100 text-violet-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
  }[tone];

  return (
    <span className={cls("flex h-14 w-14 items-center justify-center rounded-full", toneClass)}>
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {kind === "wallet" ? (
          <>
            <path d="M5 7.5h12.5A2.5 2.5 0 0 1 20 10v7a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 3 17V7.8A2.8 2.8 0 0 1 5.8 5H18" />
            <path d="M16 13h4" />
            <path d="M7 11h5" />
          </>
        ) : kind === "cart" ? (
          <>
            <path d="M4 5h2l2 10h8l2-7H7" />
            <circle cx="9" cy="19" r="1.4" />
            <circle cx="16" cy="19" r="1.4" />
          </>
        ) : kind === "trend" ? (
          <>
            <path d="M4 18h16" />
            <path d="M6 15l4-4 3 3 5-7" />
            <path d="M16 7h2v2" />
          </>
        ) : kind === "bag" ? (
          <>
            <path d="M7 9h10l1 11H6z" />
            <path d="M9 9a3 3 0 0 1 6 0" />
          </>
        ) : (
          <>
            <path d="M9 3h6" />
            <path d="M10 3v5l-2 3v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8l-2-3V3" />
            <path d="M9 14h6" />
          </>
        )}
      </svg>
    </span>
  );
}

function ReportMetricCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "violet" | "blue" | "green" | "amber";
  icon: "wallet" | "cart" | "trend" | "bag";
}) {
  const waveClass = {
    violet: "bg-violet-100",
    blue: "bg-blue-100",
    green: "bg-emerald-100",
    amber: "bg-amber-100",
  }[tone];

  return (
    <div className="relative min-h-[136px] overflow-hidden rounded-[1.55rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.3)]">
      <div className={cls("absolute inset-x-0 bottom-0 h-9 opacity-80", waveClass)} style={{ clipPath: "polygon(0 58%, 18% 40%, 38% 62%, 60% 18%, 82% 34%, 100% 8%, 100% 100%, 0 100%)" }} />
      <div className="relative flex items-center gap-5">
        <ReportIcon tone={tone} kind={icon} />
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [viewer, setViewer] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([]);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [activeView, setActiveView] = useState<"dashboard" | "reports">("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setViewer(getUser());

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [bookingsRes, hospitalsRes, doctorsRes] = await Promise.all([
          api.getBookings(),
          api.listHospitals(),
          api.listDoctors(),
        ]);

        if (!mounted) return;

        setBookings(bookingsRes.items);
        setHospitals(hospitalsRes.items);
        setDoctors(doctorsRes.items);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Gagal memuat dashboard admin");
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
    const activeBookings = bookings.filter((item) => item.status !== "COMPLETED").length;
    const activeDoctors = doctors.filter((item) => item.available).length;
    const completedBookings = bookings.filter((item) => item.status === "COMPLETED").length;
    const completionRate = bookings.length ? Math.round((completedBookings / bookings.length) * 100) : 0;
    const pendingCount = bookings.filter((item) => item.status === "PENDING").length;

    return {
      activeBookings,
      activeDoctors,
      completedBookings,
      completionRate,
      pendingCount,
    };
  }, [bookings, doctors]);

  const specialtyBreakdown = useMemo(() => {
    const totals = {
      Umum: doctors.filter((item) => item.specialty === "Umum").length,
      Diabetes: doctors.filter((item) => item.specialty === "Diabetes").length,
      Stroke: doctors.filter((item) => item.specialty === "Stroke").length,
    };

    const total = Math.max(1, totals.Umum + totals.Diabetes + totals.Stroke);

    const rows = [
      { label: "Umum", value: totals.Umum, color: "#6d28d9" },
      { label: "Diabetes", value: totals.Diabetes, color: "#0ea5e9" },
      { label: "Stroke", value: totals.Stroke, color: "#cbd5f5" },
    ].map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));

    const gradient = rows
      .reduce(
        (acc, item) => {
          const start = acc.offset;
          const end = start + item.percent;
          acc.parts.push(`${item.color} ${start}% ${end}%`);
          acc.offset = end;
          return acc;
        },
        { offset: 0, parts: [] as string[] },
      )
      .parts.join(", ");

    return {
      total: doctors.length,
      rows,
      gradient,
    };
  }, [doctors]);

  const latestActivity = useMemo(() => {
    return [...bookings]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        title: item.patientName || item.userName,
        subtitle: `${item.hospitalName} - ${item.doctorName}`,
        detail:
          item.status === "PENDING"
            ? "Booking baru menunggu triage admin"
            : item.status === "CONFIRMED"
            ? "Kasus sudah dikirim ke dokter"
            : item.status === "REVIEWED_BY_DOCTOR"
            ? "Hasil review dokter sudah masuk"
            : "Kasus sudah selesai",
        time: formatTimeAgo(item.createdAt),
      }));
  }, [bookings]);

  const hospitalCards = useMemo(() => {
    return hospitals.map((hospital) => {
      const doctorCount = doctors.filter((doctor) => doctor.hospitalId === hospital.id).length;
      const activeCount = doctors.filter((doctor) => doctor.hospitalId === hospital.id && doctor.available).length;

      return {
        ...hospital,
        doctorCount,
        activeCount,
      };
    });
  }, [doctors, hospitals]);

  const metricCards = useMemo<MetricCard[]>(
    () => [
      {
        label: "Booking Aktif",
        value: loading ? "..." : String(stats.activeBookings),
        hint: "Kasus yang masih diproses admin",
        accent: "text-slate-950",
        bubble: "bg-violet-100 text-violet-600",
      },
      {
        label: "Rumah Sakit",
        value: loading ? "..." : String(hospitals.length),
        hint: "Lokasi yang terhubung ke backend",
        accent: "text-slate-950",
        bubble: "bg-sky-100 text-sky-600",
      },
      {
        label: "Dokter Siaga",
        value: loading ? "..." : String(stats.activeDoctors),
        hint: "Dokter dengan slot aktif",
        accent: "text-slate-950",
        bubble: "bg-cyan-100 text-cyan-600",
      },
      {
        label: "Tingkat Selesai",
        value: loading ? "..." : `${stats.completionRate}%`,
        hint: `${stats.completedBookings} booking sudah selesai`,
        accent: "text-slate-950",
        bubble: "bg-emerald-100 text-emerald-600",
      },
    ],
    [hospitals.length, loading, stats.activeBookings, stats.activeDoctors, stats.completedBookings, stats.completionRate],
  );

  const reportData = useMemo(() => {
    const reviewedBookings = bookings.filter((booking) => booking.doctorReview || booking.prescription);
    const totalRevenue = reviewedBookings.reduce(
      (sum, booking) => sum + (booking.doctorReview?.estimatedCost || 0),
      0,
    );
    const medicineMap = new Map<string, { name: string; count: number; price: number; total: number }>();

    reviewedBookings.forEach((booking) => {
      booking.prescription?.items.forEach((item) => {
        const name = medicineNameOnly(item);
        if (!name) return;

        const price = parseMedicinePrice(item);
        const current = medicineMap.get(name) || { name, count: 0, price, total: 0 };
        current.count += 1;
        current.price = current.price || price;
        current.total += price;
        medicineMap.set(name, current);
      });
    });

    const soldMedicines = Array.from(medicineMap.values()).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return b.count - a.count;
    });

    return {
      reviewedBookings,
      totalRevenue,
      soldMedicines,
      soldMedicineCount: soldMedicines.reduce((sum, item) => sum + item.count, 0),
      averageRevenue: reviewedBookings.length ? Math.round(totalRevenue / reviewedBookings.length) : 0,
    };
  }, [bookings]);

  const reportMetricCards = useMemo(
    () => [
      {
        label: "Total Pendapatan",
        value: loading ? "..." : formatRupiah(reportData.totalRevenue),
        tone: "violet" as const,
        icon: "wallet" as const,
      },
      {
        label: "Transaksi Review",
        value: loading ? "..." : String(reportData.reviewedBookings.length),
        tone: "blue" as const,
        icon: "cart" as const,
      },
      {
        label: "Rata-rata Biaya",
        value: loading ? "..." : formatRupiah(reportData.averageRevenue),
        tone: "green" as const,
        icon: "trend" as const,
      },
      {
        label: "Obat Terjual",
        value: loading ? "..." : String(reportData.soldMedicineCount),
        tone: "amber" as const,
        icon: "bag" as const,
      },
    ],
    [loading, reportData.averageRevenue, reportData.reviewedBookings.length, reportData.soldMedicineCount, reportData.totalRevenue],
  );

  const menuItems: MenuItem[] = [
    { label: "Beranda", href: "/admin", icon: "home", view: "dashboard" },
    { label: "Program", href: "/admin/bookings", icon: "report" },
    { label: "Rumah Sakit", href: "/hospitals", icon: "hospital" },
    { label: "Dokter", href: "/doctors", icon: "doctor" },
    { label: "Pasien", href: "/hospitals", icon: "patient" },
    { label: "Laporan", href: "/admin", icon: "report", view: "reports" },
    { label: "Jadwal", href: "/admin/bookings", icon: "schedule" },
    { label: "Pengaturan", href: "/admin", icon: "plus" },
  ];

  return (
    <RoleGate allow={["admin"]}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_40%,#f8fafc_100%)] px-3 py-4 text-slate-900 sm:px-4 lg:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1450px] gap-4">
          <aside className="hidden w-[240px] shrink-0 rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.28)] backdrop-blur lg:flex lg:flex-col">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-lg shadow-violet-500/20 ring-1 ring-slate-200/70">
                <Image
                  src="/logo2.png"
                  alt="Lambang DIABSTROK"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-slate-950">DIABSTROK</div>
                <div className="text-xs text-slate-500">Admin Dashboard</div>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {menuItems.map((item) => {
                const active = item.view ? activeView === item.view : false;
                const className = cls(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                  active
                    ? "bg-violet-50 text-violet-700 shadow-[0_16px_30px_-24px_rgba(124,58,237,0.5)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                );

                const content = (
                  <>
                    <span
                      className={cls(
                        "flex h-9 w-9 items-center justify-center rounded-xl border",
                        active ? "border-violet-200 bg-white" : "border-slate-200 bg-white",
                      )}
                    >
                      <DashboardIcon name={item.icon} active={active} />
                    </span>
                    {item.label}
                  </>
                );

                if (item.view) {
                  return (
                    <button key={`${item.label}_${item.href}`} type="button" onClick={() => setActiveView(item.view!)} className={className}>
                      {content}
                    </button>
                  );
                }

                return (
                  <Link key={`${item.label}_${item.href}`} href={item.href} className={className}>
                    {content}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-sm font-black text-amber-700">
                  {initials(viewer?.name || "Admin")}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900">{viewer?.name || "Admin Diabstrok"}</div>
                  <div className="text-xs text-slate-500">Admin</div>
                </div>
              </div>

              <button
                onClick={() => {
                  clearSession();
                  window.location.href = "/signin";
                }}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </aside>

          <main className="flex-1 rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.25)] backdrop-blur sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="text-3xl font-black tracking-tight text-slate-950">
                  {activeView === "reports" ? "Laporan" : "Dashboard"}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {activeView === "reports"
                    ? "Laporan keuangan dan daftar obat yang terjual dari review dokter."
                    : `Selamat datang kembali, ${viewer?.name || "Admin Diabstrok"}`}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                  {formatDateLabel(new Date())}
                </div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" fill="none" aria-hidden="true">
                    <path d="M7.5 16.5h9l-1-1.5v-4a3.5 3.5 0 1 0-7 0v4l-1 1.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.5 18a1.7 1.7 0 0 0 3 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  {stats.pendingCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-violet-500 px-1 text-xs font-bold text-white">
                      {stats.pendingCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {activeView === "reports" ? (
              <div className="mt-8 grid gap-6">
                <section className="rounded-[1.7rem] border border-slate-200 bg-white px-7 py-8 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.28)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <ReportIcon tone="violet" kind="trend" />
                      <div>
                        <div className="text-2xl font-black tracking-tight text-slate-950">Laporan Keuangan</div>
                        <div className="mt-2 text-base font-medium text-slate-500">
                          Ringkasan biaya dari booking yang sudah memiliki review dokter.
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="rounded-full bg-emerald-50 px-8 py-3 text-xl font-black text-emerald-700">
                        {formatRupiah(reportData.totalRevenue)}
                      </div>
                      <div className="mt-2 text-sm font-medium text-slate-500">Total Pendapatan</div>
                    </div>
                  </div>

                  <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {reportMetricCards.map((card) => (
                      <ReportMetricCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        tone={card.tone}
                        icon={card.icon}
                      />
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.7rem] border border-slate-200 bg-white px-7 py-8 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.28)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <ReportIcon tone="violet" kind="bottle" />
                      <div>
                        <div className="text-2xl font-black tracking-tight text-slate-950">Daftar Obat Terjual</div>
                        <div className="mt-2 text-base font-medium text-slate-500">
                          Diambil dari daftar resep yang dikirim dokter ke admin.
                        </div>
                      </div>
                    </div>
                    <div className="rounded-full bg-violet-50 px-5 py-3 text-base font-bold text-violet-600">
                      {reportData.soldMedicines.length} jenis obat
                    </div>
                  </div>

                  <div className="mt-8 overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
                      <thead>
                        <tr className="text-left text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                          <th className="px-5 py-3">Nama Obat</th>
                          <th className="px-5 py-3">Harga</th>
                          <th className="px-5 py-3">Jumlah Terjual</th>
                          <th className="px-5 py-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.soldMedicines.map((medicine, index) => (
                          <tr key={medicine.name} className="text-sm text-slate-700">
                            <td className="rounded-l-[1.2rem] border-y border-l border-slate-200 bg-white px-5 py-3">
                              <div className="flex items-center gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    {index % 2 === 0 ? (
                                      <>
                                        <path d="m8 14 8-8" />
                                        <path d="M9.5 5.5h5v13h-5z" transform="rotate(45 12 12)" />
                                      </>
                                    ) : (
                                      <>
                                        <path d="M9 3h6" />
                                        <path d="M10 3v5l-2 3v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8l-2-3V3" />
                                      </>
                                    )}
                                  </svg>
                                </span>
                                <span className="font-black text-slate-950">{medicine.name}</span>
                              </div>
                            </td>
                            <td className="border-y border-slate-200 bg-white px-5 py-3">
                              {medicine.price ? formatRupiah(medicine.price) : "-"}
                            </td>
                            <td className="border-y border-slate-200 bg-white px-5 py-3">{medicine.count}</td>
                            <td className="rounded-r-[1.2rem] border-y border-r border-slate-200 bg-white px-5 py-3 font-black text-slate-950">
                              {medicine.total ? formatRupiah(medicine.total) : "-"}
                            </td>
                          </tr>
                        ))}

                        {!loading && reportData.soldMedicines.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="rounded-[1.2rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                              Belum ada obat yang tercatat terjual.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : null}

            <div className={activeView === "reports" ? "hidden" : ""}>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((card) => (
                <section
                  key={card.label}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-500">{card.label}</div>
                      <div className={cls("mt-3 text-5xl font-black leading-none", card.accent)}>{card.value}</div>
                    </div>
                    <div className={cls("flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black", card.bubble)}>+</div>
                  </div>
                  <div className="mt-4 text-sm font-medium text-emerald-500">{card.hint}</div>
                </section>
              ))}
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xl font-bold text-slate-900">Distribusi Dokter</div>
                    <div className="mt-1 text-sm text-slate-500">Sebaran dokter berdasarkan spesialis yang aktif di sistem.</div>
                  </div>
                  <Link href="/doctors" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
                    Lihat dokter
                  </Link>
                </div>

                <div className="mt-6 flex flex-col items-center gap-6 md:flex-row">
                  <div className="relative grid h-44 w-44 place-items-center rounded-full bg-slate-100">
                    <div
                      className="h-44 w-44 rounded-full"
                      style={{
                        background: `conic-gradient(${specialtyBreakdown.gradient || "#e2e8f0 0% 100%"})`,
                      }}
                    />
                    <div className="absolute grid h-28 w-28 place-items-center rounded-full bg-white shadow-inner">
                      <div className="text-center">
                        <div className="text-4xl font-black text-slate-950">{loading ? "..." : specialtyBreakdown.total}</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total</div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex-1 space-y-4">
                    {specialtyBreakdown.rows.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {item.value} dokter ({item.percent}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xl font-bold text-slate-900">Aktivitas Terbaru</div>
                  <Link href="/admin/bookings" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
                    Lihat semua
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {latestActivity.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      Belum ada aktivitas booking.
                    </div>
                  ) : null}

                  {latestActivity.map((item) => (
                    <div key={item.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-violet-600 shadow-sm">
                          {item.title.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="truncate text-sm font-bold text-slate-900">{item.title}</div>
                            <div className="whitespace-nowrap text-xs text-slate-400">{item.time}</div>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{item.subtitle}</div>
                          <div className="mt-2 text-sm text-slate-600">{item.detail}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.15fr]">
              <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xl font-bold text-slate-900">Daftar Rumah Sakit</div>
                    <div className="mt-1 text-sm text-slate-500">Tetap tampil untuk admin saat memilih lokasi pendaftaran pasien.</div>
                  </div>
                  <Link href="/hospitals" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
                    Buka daftar
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {hospitalCards.map((hospital) => (
                    <div key={hospital.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{hospital.name}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">ID {hospital.id}</div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {hospital.activeCount} dokter aktif
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Dokter</div>
                          <div className="mt-1 font-bold text-slate-900">{hospital.doctorCount}</div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Koordinat</div>
                          <div className="mt-1 font-bold text-slate-900">
                            {hospital.lat}, {hospital.lng}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xl font-bold text-slate-900">Dokter Terhubung</div>
                    <div className="mt-1 text-sm text-slate-500">Admin tetap bisa memantau semua dokter dari dashboard utama.</div>
                  </div>
                  <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-600">Monitoring</div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-3 py-2">Dokter</th>
                        <th className="px-3 py-2">Rumah Sakit</th>
                        <th className="px-3 py-2">Spesialis</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map((doctor) => {
                        const hospitalName =
                          hospitals.find((hospital) => hospital.id === doctor.hospitalId)?.name || doctor.hospitalId;

                        return (
                          <tr key={doctor.id} className="bg-slate-50 text-sm text-slate-700">
                            <td className="rounded-l-2xl px-3 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-violet-600 shadow-sm">
                                  {initials(doctor.name)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{doctor.name}</div>
                                  <div className="text-xs text-slate-500">ID {doctor.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">{hospitalName}</td>
                            <td className="px-3 py-3">{doctor.specialty}</td>
                            <td className="rounded-r-2xl px-3 py-3">
                              <span
                                className={cls(
                                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                  doctor.available ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                                )}
                              >
                                {doctor.available ? "Aktif" : "Penuh"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {!loading && doctors.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            Belum ada dokter yang terhubung.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/hospitals"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Daftarkan Pasien
                  </Link>
                  <Link
                    href="/admin/bookings"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-22px_rgba(124,58,237,0.65)] transition hover:brightness-105"
                  >
                    Kelola Booking
                  </Link>
                </div>
              </section>
            </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGate>
  );
}
