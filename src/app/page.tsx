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
        "rounded-[34px] border border-slate-200/80 bg-white px-7 py-6",
        "shadow-[0_20px_55px_-38px_rgba(15,23,42,0.22)]",
        cardGlowMap[tone],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[1.05rem] font-black tracking-tight text-slate-800">{label}</p>
          <p className="mt-4 text-5xl font-black tracking-tight text-slate-950 sm:text-[4rem]">{value}</p>
        </div>
        <div className={cls("flex h-14 w-14 items-center justify-center rounded-[20px] text-[2rem] leading-none font-black", toneMap[tone])}>+</div>
      </div>
      <p className="mt-5 text-[1.05rem] font-bold text-emerald-500">{hint}</p>
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
        <section className="relative min-h-[100svh] overflow-hidden">
          <Image
            src="/dokter.png"
            alt="Dokter profesional DIABSTROK"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.76)_36%,rgba(255,255,255,0.18)_70%,rgba(255,255,255,0.05)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_26%)]" />

          <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 pb-10 pt-28 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <SectionBadge label="Portal kesehatan terintegrasi" />

              <h1 className="mt-8 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[68px] lg:leading-[1.02]">
                Pengalaman kesehatan digital yang{" "}
                <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  elegan, jelas, dan manusiawi.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                Selamat datang di aplikasi Diabstrok.
                Setiap  usaha akan memudahkan Anda menemukan jalan keluar. Mulailah langkah Anda di sini untuk menuju kesembuhan.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#login-access"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_-22px_rgba(79,70,229,0.7)] transition hover:translate-y-[-1px]"
                >
                  Mulai Sekarang
                  <span aria-hidden="true">-&gt;</span>
                </Link>
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/92 px-7 py-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white"
                >
                  Buka Dashboard
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {heroStatCards.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/60 bg-white/78 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)] backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
                  </div>
                ))}
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
          <div className="relative overflow-hidden rounded-[42px] border border-slate-200/80 bg-white/95 px-6 py-8 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.22)] backdrop-blur sm:px-8 sm:py-10 lg:px-14 lg:py-18">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-72 bg-[radial-gradient(circle_at_left_bottom,rgba(191,219,254,0.28),transparent_62%)]" />
            <div className="pointer-events-none absolute right-[-6%] top-[-10%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.18),transparent_68%)]" />
            <div className="pointer-events-none absolute bottom-[-14%] left-[-8%] h-64 w-64 rounded-full border border-violet-100/70" />
            <div className="pointer-events-none absolute right-[-3%] top-8 h-44 w-44 opacity-40 [background-image:radial-gradient(#bfdbfe_1.2px,transparent_1.2px)] [background-size:12px_12px]" />

            <div className="relative">
              <SectionBadge label="Keunggulan platform" />

              <div className="mt-10 grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
                <div className="max-w-4xl">
                  <h2 className="text-[2rem] font-black tracking-tight text-slate-950 sm:text-[2.5rem] sm:leading-[1.2] lg:text-[3.15rem] lg:leading-[1.24]">
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
          <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#111827_48%,#1e1b4b_100%)] p-6 text-white shadow-[0_30px_90px_-52px_rgba(15,23,42,0.75)] sm:p-8">
            <SectionBadge label="Alur klien" />

            <div className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {clientSteps.map((item) => (
                  <div key={item.step} className="rounded-[26px] border border-white/10 bg-white/6 p-5 backdrop-blur">
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
              <h2 className="text-3xl font-black tracking-tight text-slate-950">Dokter Specialis </h2>
            </div>
            <Link href="/doctors" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
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
              <h2 className="text-3xl font-black tracking-tight text-slate-950">Rumah sakit (hospital)</h2>
            
            </div>
            <Link href="/hospitals" className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(79,70,229,0.7)] transition hover:translate-y-[-1px]">
              Lihat Semua Rumah Sakit
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {hospitalDoctorMap.map((hospital) => {
              const visual = getHospitalVisual(hospital);

              return (
                <article
                  key={hospital.id}
                  className="mesh-panel relative overflow-hidden rounded-[30px] border border-slate-200/80 p-6 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.28)]"
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

                      <div className="flex items-center gap-3 self-start lg:flex-col lg:items-end">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-600 shadow-sm">
                          {hospital.availableCount} dokter aktif
                        </span>

                        <div className={cls("relative flex h-36 w-60 items-center justify-center overflow-hidden rounded-[28px] border shadow-[0_20px_38px_-24px_rgba(15,23,42,0.35)]", visual.frame)}>
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
