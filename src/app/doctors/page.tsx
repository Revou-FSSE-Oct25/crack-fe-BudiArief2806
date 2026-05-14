"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import { useToast } from "@/app/components/Toast";
import { api } from "@/app/lib/api";
import { useSessionPreferences } from "@/app/lib/use-preferences";
import type { DoctorRecord, HospitalRecord, Specialty } from "@/app/lib/types";

type DoctorView = DoctorRecord & {
  hospitalName: string;
};

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getDoctorAvatar(name: string) {
  const key = name.toLowerCase();

  if (key.includes("andi")) {
    return { src: "/face/andi.png", objectPosition: "center", scale: 1 };
  }
  if (key.includes("bagus")) {
    return { src: "/face/bagus.png", objectPosition: "center", scale: 1 };
  }
  if (key.includes("nanda")) {
    return { src: "/face/nanda.png", objectPosition: "center", scale: 1 };
  }
  if (key.includes("siti") || key.includes("rahma")) {
    return { src: "/face/rahma.png", objectPosition: "center", scale: 1 };
  }
  return { src: "/dokter.png", objectPosition: "center", scale: 1 };
}

const doctorsCopy = {
  id: {
    label: "Direktori Medis",
    title: "Pilih dokter dan lanjutkan ke booking rumah sakit.",
    subtitle: "Halaman ini membaca data dokter dari backend NestJS lalu mengarahkan user ke halaman booking dengan rumah sakit dan spesialis yang relevan.",
    search: "Cari nama dokter, spesialis, atau rumah sakit",
    allSpecialties: "Semua spesialis",
    loadError: "Gagal memuat daftar dokter",
    loadErrorTitle: "Gagal memuat dokter",
    loading: "Memuat dokter dari backend...",
    empty: "Tidak ada dokter yang cocok dengan filter saat ini.",
    status: "Status",
    available: "Tersedia",
    unavailable: "Belum tersedia",
    continueBooking: "Lanjut ke Booking",
    focusHospital: "Fokus Rumah Sakit",
    fallbackLoading: "Memuat halaman dokter...",
  },
  en: {
    label: "Medical Directory",
    title: "Choose a doctor and continue to hospital booking.",
    subtitle: "This page reads doctor data from the NestJS backend and sends users to booking with the relevant hospital and specialty.",
    search: "Search doctor name, specialty, or hospital",
    allSpecialties: "All specialties",
    loadError: "Failed to load doctor list",
    loadErrorTitle: "Failed to load doctors",
    loading: "Loading doctors from backend...",
    empty: "No doctors match the current filter.",
    status: "Status",
    available: "Available",
    unavailable: "Unavailable",
    continueBooking: "Continue to Booking",
    focusHospital: "Focus Hospital",
    fallbackLoading: "Loading doctor page...",
  },
};

function DoctorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { language, darkMode } = useSessionPreferences();
  const copy = doctorsCopy[language];

  const [items, setItems] = useState<DoctorView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<Specialty | "Semua">("Semua");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [doctorsRes, hospitalsRes] = await Promise.all([
          api.listDoctors(),
          api.listHospitals(),
        ]);

        if (!mounted) return;

        const hospitalsById = new Map<string, HospitalRecord>(
          hospitalsRes.items.map((hospital) => [hospital.id, hospital])
        );

        const nextItems = doctorsRes.items.map((doctor) => ({
          ...doctor,
          hospitalName: hospitalsById.get(doctor.hospitalId)?.name || doctor.hospitalId,
        }));

        setItems(nextItems);
      } catch (err: any) {
        if (!mounted) return;
        const message = err?.message || copy.loadError;
        setError(message);
        showToast({ tone: "error", title: copy.loadErrorTitle, description: message });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [showToast, copy.loadError, copy.loadErrorTitle]);

  const pickedId = searchParams.get("pick") || "";

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return items.filter((doctor) => {
      const matchesSpecialty = specialty === "Semua" || doctor.specialty === specialty;
      const haystack = `${doctor.name} ${doctor.specialty} ${doctor.hospitalName}`.toLowerCase();
      const matchesQuery = !keyword || haystack.includes(keyword);
      return matchesSpecialty && matchesQuery;
    });
  }, [items, query, specialty]);

  return (
    <div
      className={cls(
        "min-h-screen",
        darkMode
          ? "bg-[radial-gradient(circle_at_top,#172554_0%,#020617_48%,#020617_100%)] text-slate-100"
          : "bg-[radial-gradient(circle_at_top,#eefaf7_0%,#f8fbff_42%,#f8fafc_80%)] text-slate-900",
      )}
    >
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section
          className={cls(
            "rounded-[2rem] border p-6 shadow-[0_26px_90px_-56px_rgba(15,23,42,0.35)] backdrop-blur",
            darkMode ? "border-slate-800 bg-slate-900/90" : "border-white/70 bg-white/85",
          )}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
            {copy.label}
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          </div>

          <h1 className={cls("mt-4 text-3xl font-black tracking-tight sm:text-4xl", darkMode ? "text-white" : "text-slate-950")}>
            {copy.title}
          </h1>
          <p className={cls("mt-3 max-w-3xl text-sm leading-7", darkMode ? "text-slate-300" : "text-slate-600")}>
            {copy.subtitle}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.search}
              className={cls(
                "h-12 rounded-2xl border px-4 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100",
                darkMode ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-900",
              )}
            />
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as Specialty | "Semua")}
              className={cls(
                "h-12 rounded-2xl border px-4 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100",
                darkMode ? "border-slate-700 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900",
              )}
            >
              <option value="Semua">{copy.allSpecialties}</option>
              <option value="Umum">Umum</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Stroke">Stroke</option>
            </select>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className={cls("rounded-3xl border p-6 text-sm", darkMode ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-600")}>
              {copy.loading}
            </div>
          ) : null}

          {!loading && filtered.length === 0 ? (
            <div className={cls("rounded-3xl border border-dashed p-6 text-sm", darkMode ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-600")}>
              {copy.empty}
            </div>
          ) : null}

          {filtered.map((doctor) => {
            const active = doctor.id === pickedId;
            const avatar = getDoctorAvatar(doctor.name);

            return (
              <article
                key={doctor.id}
                className={cls(
                  "rounded-3xl border p-6 shadow-sm transition",
                  darkMode ? "bg-slate-900 text-slate-100" : "bg-white",
                  active ? "border-sky-200 ring-2 ring-sky-100" : darkMode ? "border-slate-800" : "border-slate-200"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cls("relative h-14 w-14 overflow-hidden rounded-2xl border shadow-sm", darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50")}>
                    <Image
                      src={avatar.src}
                      alt={`Foto ${doctor.name}`}
                      fill
                      sizes="56px"
                      className="object-cover"
                      style={{
                        objectPosition: avatar.objectPosition,
                        transform: `scale(${avatar.scale})`,
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={cls("text-lg font-black", darkMode ? "text-white" : "text-slate-950")}>{doctor.name}</h2>
                      <span
                        className={cls(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          doctor.specialty === "Stroke"
                            ? "bg-rose-50 text-rose-700"
                            : doctor.specialty === "Diabetes"
                            ? "bg-teal-50 text-teal-700"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {doctor.specialty}
                      </span>
                    </div>
                    <div className={cls("mt-2 text-sm", darkMode ? "text-slate-300" : "text-slate-600")}>{doctor.hospitalName}</div>
                    <div className={cls("mt-2 text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>
                      {copy.status}: {doctor.available ? copy.available : copy.unavailable}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/hospitals?hid=${encodeURIComponent(doctor.hospitalId)}&spec=${encodeURIComponent(doctor.specialty)}`
                      )
                    }
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {copy.continueBooking}
                  </button>
                  <button
                    onClick={() => setQuery(doctor.hospitalName)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {copy.focusHospital}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Memuat halaman dokter...
            </div>
          </main>
        </div>
      }
    >
      <DoctorsPageContent />
    </Suspense>
  );
}
