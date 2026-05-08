"use client";

// Dashboard admin.
// Admin melihat ringkasan semua booking dan masuk ke halaman pengelolaan booking detail.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { RoleGate } from "@/app/components/RoleGate";
import { api } from "@/app/lib/api";
import type { Booking, DoctorRecord, HospitalRecord } from "@/app/lib/types";

export default function AdminPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([]);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Admin mengambil seluruh booking dari backend untuk monitoring operasional.
      setLoading(true);
      setError(null);

      try {
        const [bookingsRes, hospitalsRes, doctorsRes] = await Promise.all([
          api.getBookings(),
          api.listHospitals(),
          api.listDoctors(),
        ]);

        if (!mounted) return;
        setItems(bookingsRes.items);
        setHospitals(hospitalsRes.items);
        setDoctors(doctorsRes.items);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Gagal memuat booking admin");
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
    const pending = items.filter((item) => item.status === "PENDING").length;
    const sentToDoctor = items.filter((item) => item.status === "CONFIRMED").length;
    const reviewed = items.filter((item) => item.status === "REVIEWED_BY_DOCTOR").length;
    const completed = items.filter((item) => item.status === "COMPLETED").length;

    return {
      total: items.length,
      pending,
      sentToDoctor,
      reviewed,
      completed,
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <RoleGate allow={["admin"]}>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Admin Panel</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Panel ini membaca seluruh booking dari backend NestJS sebagai sumber data utama.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/hospitals"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Daftarkan Pasien
                </Link>
                <Link
                  href="/admin/bookings"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Kelola Booking
                </Link>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Booking", value: stats.total },
              { label: "Pending", value: stats.pending },
              { label: "Dikirim ke Dokter", value: stats.sentToDoctor },
              { label: "Sudah Direview", value: stats.reviewed },
              { label: "Completed", value: stats.completed },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-medium text-slate-500">{card.label}</div>
                <div className="mt-2 text-3xl font-black text-slate-950">
                  {loading ? <span className="text-lg font-semibold text-slate-400">...</span> : card.value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Daftar Rumah Sakit</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Dua rumah sakit backend tetap ditampilkan di halaman admin.
                  </p>
                </div>

                <Link
                  href="/hospitals"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Lihat Semua
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {loading ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                    Memuat rumah sakit...
                  </div>
                ) : null}

                {!loading && hospitals.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Belum ada rumah sakit dari backend.
                  </div>
                ) : null}

                {hospitals.map((hospital) => (
                  <div key={hospital.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-900">{hospital.name}</div>
                    <div className="mt-1 text-xs text-slate-500">ID: {hospital.id}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Daftar Dokter</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Admin tetap bisa melihat daftar dokter sebelum membantu pasien daftar.
                  </p>
                </div>

                <Link
                  href="/doctors"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Lihat Semua
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {loading ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                    Memuat dokter...
                  </div>
                ) : null}

                {!loading && doctors.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Belum ada dokter dari backend.
                  </div>
                ) : null}

                {doctors.map((doctor) => {
                  const hospitalName =
                    hospitals.find((hospital) => hospital.id === doctor.hospitalId)?.name || doctor.hospitalId;

                  return (
                    <div key={doctor.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{doctor.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {doctor.specialty} - {hospitalName}
                          </div>
                        </div>
                        <div
                          className={
                            doctor.available
                              ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                              : "rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                          }
                        >
                          {doctor.available ? "Tersedia" : "Penuh"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Checklist Integrasi</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "Frontend memanggil endpoint auth dan bookings di NestJS",
                "Swagger dipakai untuk dokumentasi dan uji endpoint resmi",
                "Admin bisa daftar pasien walk-in tanpa menghapus daftar rumah sakit dan dokter",
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
