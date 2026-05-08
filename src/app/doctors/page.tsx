"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import { useToast } from "@/app/components/Toast";
import { api } from "@/app/lib/api";
import type { DoctorRecord, HospitalRecord, Specialty } from "@/app/lib/types";

type DoctorView = DoctorRecord & {
  hospitalName: string;
};

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .replace(/^dr\.\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function DoctorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

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
        const message = err?.message || "Gagal memuat daftar dokter";
        setError(message);
        showToast({ tone: "error", title: "Gagal memuat dokter", description: message });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [showToast]);

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eefaf7_0%,#f8fbff_42%,#f8fafc_80%)] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_26px_90px_-56px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
            Medical Directory
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Pilih dokter dan lanjutkan ke booking rumah sakit.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Halaman ini membaca data dokter dari backend NestJS lalu mengarahkan user ke halaman booking dengan rumah
            sakit dan spesialis yang relevan.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama dokter, spesialis, atau rumah sakit"
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as Specialty | "Semua")}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="Semua">Semua spesialis</option>
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
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Memuat dokter dari backend...
            </div>
          ) : null}

          {!loading && filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
              Tidak ada dokter yang cocok dengan filter saat ini.
            </div>
          ) : null}

          {filtered.map((doctor) => {
            const active = doctor.id === pickedId;

            return (
              <article
                key={doctor.id}
                className={cls(
                  "rounded-3xl border bg-white p-6 shadow-sm transition",
                  active ? "border-sky-200 ring-2 ring-sky-100" : "border-slate-200"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                    {initials(doctor.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-slate-950">{doctor.name}</h2>
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
                    <div className="mt-2 text-sm text-slate-600">{doctor.hospitalName}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      Status: {doctor.available ? "Tersedia" : "Belum tersedia"}
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
                    Lanjut ke Booking
                  </button>
                  <button
                    onClick={() => setQuery(doctor.hospitalName)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Fokus Rumah Sakit
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
