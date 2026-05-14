"use client";

// Landing page utama dibuat sebagai alur scroll tunggal.
// Section utama berisi hero, preview dashboard, ajakan login, dokter tersedia, dan rumah sakit tersedia.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { getRole } from "@/app/lib/auth";
import { api } from "@/app/lib/api";
import type { DoctorRecord, HospitalRecord } from "@/app/lib/types";

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

function getHospitalVisual(hospital: HospitalRecord) {
  const key = `${hospital.id} ${hospital.name}`.toLowerCase();

  if (key.includes("primaya")) {
    return {
      src: "/primaya.png",
      alt: "Logo RS Primaya",
      badge: "Primaya Network",
      glow: "from-cyan-200/60 via-sky-100/30 to-white/10",
      frame: "border-cyan-100 bg-white/90",
    };
  }

  if (key.includes("thb") || key.includes("taman harapan baru")) {
    return {
      src: "/thb2.png",
      alt: "Logo RS Taman Harapan Baru",
      badge: "THB Care",
      glow: "from-violet-200/60 via-fuchsia-100/35 to-white/10",
      frame: "border-violet-100 bg-white/90",
    };
  }

  return {
    src: null,
    alt: "",
    badge: "Hospital Partner",
    glow: "from-slate-200/60 via-slate-100/35 to-white/10",
    frame: "border-slate-200 bg-white/90",
  };
}

function getDoctorPortrait(name: string) {
  const key = name.toLowerCase();

  if (key.includes("rina")) {
    return {
      src: "/dr.rahma.png",
      alt: `Ilustrasi dokter untuk ${name}`,
      objectPosition: "center top",
      scale: 1,
      badge: "Dokter Umum",
    };
  }

  if (key.includes("siti") || key.includes("rahma")) {
    return {
      src: "/dr.rahma.png",
      alt: `Ilustrasi dokter untuk ${name}`,
      objectPosition: "center top",
      scale: 1,
      badge: "Dokter Diabetes",
    };
  }

  if (key.includes("andi")) {
    return {
      src: "/dr.andi.png",
      alt: `Ilustrasi dokter untuk ${name}`,
      objectPosition: "center top",
      scale: 1,
      badge: "Dokter Umum",
    };
  }

  if (key.includes("bagus")) {
    return {
      src: "/dr.bagus.png",
      alt: `Ilustrasi dokter untuk ${name}`,
      objectPosition: "center top",
      scale: 1,
      badge: "Dokter Stroke",
    };
  }

  if (key.includes("nanda")) {
    return {
      src: "/dr.nanda.png",
      alt: `Ilustrasi dokter untuk ${name}`,
      objectPosition: "center top",
      scale: 1,
      badge: "Dokter Umum",
    };
  }

  return {
    src: "/dokter.png",
    alt: `Ilustrasi dokter untuk ${name}`,
    objectPosition: "center top",
    scale: 1,
    badge: "Dokter",
  };
}

function SectionBadge({ label }: { label: string }) {
  return (
    <div className="section-label">
      <span className="section-dot" />
      {label}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "violet" | "blue" | "cyan" | "green";
}) {
  const toneMap = {
    violet: "bg-violet-100 text-violet-600 shadow-[0_12px_32px_-26px_rgba(168,85,247,0.85)]",
    blue: "bg-blue-100 text-blue-600 shadow-[0_12px_32px_-26px_rgba(59,130,246,0.85)]",
    cyan: "bg-cyan-100 text-cyan-600 shadow-[0_12px_32px_-26px_rgba(6,182,212,0.85)]",
    green: "bg-emerald-100 text-emerald-600 shadow-[0_12px_32px_-26px_rgba(16,185,129,0.85)]",
  } as const;

  const cardGlowMap = {
    violet: "shadow-[0_28px_50px_-34px_rgba(168,85,247,0.42)]",
    blue: "shadow-[0_28px_50px_-34px_rgba(59,130,246,0.42)]",
    cyan: "shadow-[0_28px_50px_-34px_rgba(6,182,212,0.42)]",
    green: "shadow-[0_28px_50px_-34px_rgba(16,185,129,0.42)]",
  } as const;

  return (
    <div
      className={cls(
        "rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 sm:rounded-[34px] sm:px-7 sm:py-6",
        "shadow-[0_20px_55px_-38px_rgba(15,23,42,0.22)]",
        cardGlowMap[tone],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-black tracking-tight text-slate-800 sm:text-[1.05rem]">{label}</p>
          <p className="mt-4 text-[2.75rem] font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[4rem]">{value}</p>
        </div>
        <div className={cls("flex h-12 w-12 items-center justify-center rounded-[18px] text-[1.7rem] leading-none font-black sm:h-14 sm:w-14 sm:rounded-[20px] sm:text-[2rem]", toneMap[tone])}>+</div>
      </div>
      <p className="mt-4 text-sm font-bold text-emerald-500 sm:mt-5 sm:text-[1.05rem]">{hint}</p>
    </div>
  );
}

export default function HomePage() {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "doctor" | "user" | null>(null);

  useEffect(() => {
    setRole(getRole());

    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [doctorsRes, hospitalsRes] = await Promise.all([api.listDoctors(), api.listHospitals()]);

        if (!mounted) return;

        setDoctors(doctorsRes.items);
        setHospitals(hospitalsRes.items);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Gagal memuat data halaman utama");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const doctorStats = useMemo(() => {
    const availableDoctors = doctors.filter((item) => item.available).length;
    const generalDoctors = doctors.filter((item) => item.specialty === "Umum").length;
    const diabetesDoctors = doctors.filter((item) => item.specialty === "Diabetes").length;
    const strokeDoctors = doctors.filter((item) => item.specialty === "Stroke").length;

    return {
      availableDoctors,
      generalDoctors,
      diabetesDoctors,
      strokeDoctors,
    };
  }, [doctors]);

  const featuredDoctors = useMemo(() => {
    // Halaman utama hanya menampilkan 4 dokter unggulan agar landing page tetap ringkas.
    // Dokter Rina tetap ada di halaman /doctors, tetapi tidak dimunculkan di home.
    return doctors.filter((doctor) => !doctor.name.toLowerCase().includes("rina")).slice(0, 4);
  }, [doctors]);

  const hospitalDoctorMap = useMemo(() => {
    return hospitals.map((hospital) => ({
      ...hospital,
      doctorCount: doctors.filter((doctor) => doctor.hospitalId === hospital.id).length,
      availableCount: doctors.filter((doctor) => doctor.hospitalId === hospital.id && doctor.available).length,
    }));
  }, [doctors, hospitals]);

  const dashboardHref = role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/dashboard";
  const heroStatCards = [
    {
      label: "Dokter Aktif",
      value: loading ? "..." : String(doctorStats.availableDoctors),
      hint: "Siap melayani pasien",
    },
    {
      label: "Rumah Sakit",
      value: loading ? "..." : String(hospitals.length),
      hint: "Terhubung ke platform",
    },
    {
      label: "Spesialis",
      value: "3",
      hint: "Umum, Diabetes, Stroke",
    },
  ];
  const clientSteps = [
    {
      step: "01",
      title: "Buat akun user",
      note: "Mulai dari halaman daftar agar klien punya akun aktif untuk booking.",
    },
    {
      step: "02",
      title: "Login ke sistem",
      note: "Masuk ke akun yang sudah dibuat untuk membuka akses dashboard dan proses booking.",
    },
    {
      step: "03",
      title: "Pilih rumah sakit",
      note: "Buka daftar rumah sakit, lalu tentukan lokasi dan spesialis yang paling sesuai.",
    },
    {
      step: "04",
      title: "Pilih dokter",
      note: "Setelah rumah sakit dipilih, klien memilih dokter yang tersedia sesuai kebutuhan.",
    },
    {
      step: "05",
      title: "Pilih ruangan dan isi keluhan",
      note: "Lanjutkan dengan memilih ruangan yang siap dipakai lalu isi keluhan singkat.",
    },
    {
      step: "06",
      title: "Kirim booking dan pantau status",
      note: "Booking tersimpan ke sistem dan klien bisa memantau progresnya dari riwayat booking.",
    },
  ];

  return (
    <div id="top" className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_46%,#ffffff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[780px] overflow-hidden">
        <div className="absolute left-[-12%] top-24 h-[460px] w-[460px] rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute right-[-12%] top-12 h-[460px] w-[460px] rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <Navbar />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,255,0.98)_48%,rgba(255,255,255,0.92)_100%)]" />
          <div className="absolute left-[-10%] top-16 -z-10 h-60 w-60 rounded-full bg-violet-200/35 blur-3xl sm:h-80 sm:w-80" />
          <div className="absolute right-[-14%] top-24 -z-10 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl sm:h-96 sm:w-96" />

          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-18 sm:pt-10 lg:px-8 lg:pb-24 lg:pt-14">
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:gap-10">
              <div className="max-w-2xl rounded-[32px] border border-white/70 bg-white/76 p-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.3)] backdrop-blur sm:p-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
              <SectionBadge label="Portal kesehatan terintegrasi" />

              <h1 className="mt-6 text-[2.35rem] font-black leading-[1.02] tracking-tight text-slate-950 sm:mt-8 sm:text-5xl lg:text-[68px] lg:leading-[1.02]">
                Pengalaman kesehatan digital yang{" "}
                <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  elegan, jelas, dan manusiawi.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[0.98rem] leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
                Selamat datang di aplikasi Diabstrok.
                Setiap  usaha akan memudahkan Anda menemukan jalan keluar. Mulailah langkah Anda di sini untuk menuju kesembuhan.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                <Link
                  href="#login-access"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_-22px_rgba(79,70,229,0.7)] transition hover:translate-y-[-1px] sm:min-w-[200px]"
                >
                  Mulai Sekarang
                  <span aria-hidden="true">-&gt;</span>
                </Link>
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/92 px-7 py-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white sm:min-w-[200px]"
                >
                  Buka Dashboard
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
                {heroStatCards.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/60 bg-white/82 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)] backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
                  </div>
                ))}
              </div>
            </div>

              <div className="relative">
                <div className="absolute inset-x-10 top-6 h-24 rounded-full bg-violet-200/45 blur-3xl sm:inset-x-16 sm:h-28" />
                <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(240,249,255,0.74))] p-3 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.35)]">
                  <div className="relative min-h-[340px] overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(226,232,240,0.5)_48%,rgba(219,234,254,0.56)_100%)] sm:min-h-[440px] lg:min-h-[640px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(191,219,254,0.7),transparent_36%),radial-gradient(circle_at_top_left,rgba(233,213,255,0.58),transparent_36%)]" />
                    <Image
                      src="/dokter.png"
                      alt="Dokter profesional DIABSTROK"
                      fill
                      priority
                      sizes="(min-width: 1024px) 42vw, (min-width: 640px) 70vw, 100vw"
                      className="object-cover object-[center_top]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.08)_44%,rgba(255,255,255,0.9)_100%)]" />

                    <div className="absolute left-4 top-4 rounded-full border border-white/80 bg-white/88 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 shadow-sm backdrop-blur sm:left-6 sm:top-6">
                      Konsultasi modern
                    </div>

                    <div className="absolute inset-x-4 bottom-4 grid gap-3 sm:inset-x-6 sm:bottom-6 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-white/70 bg-white/86 p-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Alur lebih jelas</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">Booking, pilih dokter, dan akses dashboard terasa rapi bahkan di layar kecil.</p>
                      </div>
                      <div className="rounded-[24px] border border-white/70 bg-slate-950/88 p-4 text-white shadow-[0_18px_44px_-26px_rgba(15,23,42,0.55)] backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Akses cepat</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">Masuk ke portal kapan saja untuk memantau rumah sakit, dokter, dan status booking.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          </section>
        ) : null}

        <section id="dashboard-preview" className="mx-auto max-w-7xl px-4 pb-18 pt-2 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 px-5 py-7 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.22)] backdrop-blur sm:rounded-[42px] sm:px-8 sm:py-10 lg:px-14 lg:py-18">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-72 bg-[radial-gradient(circle_at_left_bottom,rgba(191,219,254,0.28),transparent_62%)]" />
            <div className="pointer-events-none absolute right-[-6%] top-[-10%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.18),transparent_68%)]" />
            <div className="pointer-events-none absolute bottom-[-14%] left-[-8%] h-64 w-64 rounded-full border border-violet-100/70" />
            <div className="pointer-events-none absolute right-[-3%] top-8 h-44 w-44 opacity-40 [background-image:radial-gradient(#bfdbfe_1.2px,transparent_1.2px)] [background-size:12px_12px]" />

            <div className="relative">
              <SectionBadge label="Keunggulan platform" />

              <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-10">
                <div className="max-w-4xl">
                  <h2 className="text-[1.9rem] font-black tracking-tight text-slate-950 sm:text-[2.35rem] sm:leading-[1.2] lg:text-[3.15rem] lg:leading-[1.24]">
                    Diabstroke hadir untuk memudahkan Anda menemukan dokter yang tersedia, sehingga Anda dapat memperoleh
                    penanganan yang tepat tanpa harus menunggu terlalu lama.
                  </h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <StatCard label="Dokter Umum" value={String(doctorStats.generalDoctors)} hint="Siap untuk konsultasi umum" tone="violet" />
                  <StatCard label="Dokter Diabetes" value={String(doctorStats.diabetesDoctors)} hint="Untuk monitoring diabetes" tone="blue" />
                  <StatCard label="Dokter Stroke" value={String(doctorStats.strokeDoctors)} hint="Pemantauan stroke aktif" tone="cyan" />
                  <StatCard label="Akses Cepat" value="24/7" hint="Masuk kapan saja dari web" tone="green" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="login-access" className="mx-auto max-w-7xl px-4 pb-18 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#111827_48%,#1e1b4b_100%)] p-5 text-white shadow-[0_30px_90px_-52px_rgba(15,23,42,0.75)] sm:rounded-[32px] sm:p-8">
            <SectionBadge label="Alur klien" />

            <div className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {clientSteps.map((item) => (
                  <div key={item.step} className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur sm:rounded-[26px] sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-cyan-200">
                        {item.step}
                      </div>
                      <div className="text-lg font-black">{item.title}</div>
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-300">{item.note}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_18px_38px_-24px_rgba(168,85,247,0.85)] transition hover:translate-y-[-1px] hover:from-violet-400 hover:to-fuchsia-400"
                >
                  Mulai Daftar
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Login User
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="doctor-availability" className="mx-auto max-w-7xl px-4 pb-18 sm:px-6 lg:px-8">
          <SectionBadge label="Daftar dokter tersedia" />

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[1.9rem] font-black tracking-tight text-slate-950 sm:text-3xl">Dokter Specialis </h2>
            </div>
            <Link href="/doctors" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto">
              Buka Semua Dokter
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredDoctors.map((doctor) => {
              const hospitalName = hospitals.find((item) => item.id === doctor.hospitalId)?.name || doctor.hospitalId;
              const portrait = getDoctorPortrait(doctor.name);

              return (
                <article
                  key={doctor.id}
                  className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_20px_55px_-38px_rgba(15,23,42,0.35)] transition hover:-translate-y-1"
                >
                  <div className="relative h-52 overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_100%)]">
                    <Image
                      src={portrait.src}
                      alt={portrait.alt}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                      style={{
                        objectPosition: portrait.objectPosition,
                        transform: `scale(${portrait.scale})`,
                      }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.08)_60%,rgba(255,255,255,0.88)_100%)]" />
                    <div className="absolute left-5 top-5 rounded-full bg-white/88 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 shadow-sm">
                      {portrait.badge}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <Image
                          src="/logo2.png"
                          alt="Logo DIABSTROK"
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <span
                        className={cls(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          doctor.available ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                        )}
                      >
                        {doctor.available ? "Tersedia" : "Penuh"}
                      </span>
                    </div>

                    <div className="mt-5 text-xl font-black tracking-tight text-slate-950">{doctor.name}</div>
                    <div className="mt-2 text-sm font-medium text-violet-600">{doctor.specialty}</div>
                    <div className="mt-4 text-sm leading-7 text-slate-500">{hospitalName}</div>
                  </div>
                </article>
              );
            })}

            {!loading && featuredDoctors.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                Belum ada dokter yang tersedia.
              </div>
            ) : null}
          </div>
        </section>

        <section id="hospital-availability" className="mx-auto max-w-7xl px-4 pb-22 sm:px-6 lg:px-8">
          <SectionBadge label="Rumah sakit tersedia" />

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[1.9rem] font-black tracking-tight text-slate-950 sm:text-3xl">Rumah sakit (hospital)</h2>
            
            </div>
            <Link href="/hospitals" className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-center text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(79,70,229,0.7)] transition hover:translate-y-[-1px] sm:w-auto">
              Lihat Semua Rumah Sakit
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {hospitalDoctorMap.map((hospital) => {
              const visual = getHospitalVisual(hospital);

              return (
                <article
                  key={hospital.id}
                  className="mesh-panel relative overflow-hidden rounded-[28px] border border-slate-200/80 p-5 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.28)] sm:rounded-[30px] sm:p-6"
                >
                  <div className={cls("pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-r opacity-90", visual.glow)} />

                  <div className="relative flex flex-col gap-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 shadow-sm backdrop-blur">
                          {visual.badge}
                        </div>
                        <div className="mt-4 text-[1.45rem] font-black tracking-tight text-slate-950 sm:text-[1.6rem]">
                          {hospital.name}
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">ID {hospital.id}</div>
                      </div>

                      <div className="flex flex-col items-stretch gap-3 self-stretch sm:self-start lg:items-end">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-600 shadow-sm">
                          {hospital.availableCount} dokter aktif
                        </span>

                        <div className={cls("relative flex h-32 w-full items-center justify-center overflow-hidden rounded-[24px] border shadow-[0_20px_38px_-24px_rgba(15,23,42,0.35)] sm:h-36 sm:w-60 sm:rounded-[28px]", visual.frame)}>
                          {visual.src ? (
                            <Image
                              src={visual.src}
                              alt={visual.alt}
                              fill
                              sizes="240px"
                              className="object-contain p-1.5"
                            />
                          ) : (
                            <div className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">{initials(hospital.name)}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-sm">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Dokter</div>
                        <div className="mt-2 text-2xl font-black text-slate-950">{hospital.doctorCount}</div>
                      </div>
                      <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-sm">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Latitude</div>
                        <div className="mt-2 text-sm font-bold text-slate-950">{hospital.lat}</div>
                      </div>
                      <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-sm">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Longitude</div>
                        <div className="mt-2 text-sm font-bold text-slate-950">{hospital.lng}</div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {!loading && hospitals.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 md:col-span-2">
                Belum ada rumah sakit yang tersedia.
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
