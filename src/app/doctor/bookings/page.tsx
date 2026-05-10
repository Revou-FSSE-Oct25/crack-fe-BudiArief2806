"use client";

// Halaman review booking untuk dokter.
// Dokter mengirim diagnosis, biaya, resep, dan saran kesehatan kembali ke admin.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGate } from "@/app/components/RoleGate";
import { useToast } from "@/app/components/Toast";
import { api } from "@/app/lib/api";
import { createDoctorReviewSchema } from "@/app/lib/schemas";
import { getPrescriptionTemplate, type Booking, type BookingStatus, type DiseaseStage } from "@/app/lib/types";

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

const diabetesMedicines = [
  { name: "Glucophage 500 Mg 10 Tablet", price: 31500 },
  { name: "Amaryl 1 Mg 10 Tablet", price: 62381 },
  { name: "Metformin Tablet Hexpharm", price: 25000 },
  { name: "Kombiglyze XR 5 Mg/500 Mg 7 Tablet", price: 220120 },
  { name: "Acarbose 50 Mg 10 Tablet Dexa Medica", price: 21000 },
  { name: "Glibenclamide 5 Mg 10 Tablet Kimia Farma", price: 16500 },
  { name: "Forbetes 500 mg 10 Tablet", price: 24350 },
];

function formatRupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function medicineLine(medicine: { name: string; price: number }) {
  return `${medicine.name} - ${formatRupiah(medicine.price)}`;
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg =
    status === "PENDING"
      ? { text: "Belum Dikirim Admin", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" }
      : status === "CONFIRMED"
      ? { text: "Siap Direview", cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" }
      : status === "REVIEWED_BY_DOCTOR"
      ? { text: "Sudah Direview", cls: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" }
      : { text: "Selesai", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" };

  return (
    <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cfg.cls)}>
      {cfg.text}
    </span>
  );
}

export default function DoctorBookingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<Booking[]>([]);
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editId, setEditId] = useState("");
  const [stage, setStage] = useState<DiseaseStage>("STADIUM_1");
  const [rxText, setRxText] = useState("");
  const [rxNotes, setRxNotes] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("0");
  const [healthAdvice, setHealthAdvice] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    setError("");

    try {
      const res = await api.getBookings();
      const list = [...res.items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setItems(list);
    } catch (err: any) {
      const message = err?.message || "Gagal memuat booking dokter";
      setError(message);
      showToast({ tone: "error", title: "Gagal memuat data dokter", description: message });
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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [items, q]);

  function openReview(booking: Booking) {
    setEditId(booking.id);

    if (booking.doctorReview && booking.prescription) {
      setSymptoms(booking.doctorReview.symptoms);
      setDiagnosis(booking.doctorReview.diagnosis);
      setEstimatedCost(String(booking.doctorReview.estimatedCost));
      setHealthAdvice(booking.doctorReview.healthAdvice);
      setStage(booking.prescription.stage);
      setRxText(booking.prescription.items.join("\n"));
      setRxNotes(booking.prescription.notes || "");
      return;
    }

    const template = getPrescriptionTemplate(booking.specialty, "STADIUM_1");
    setSymptoms(booking.complaint);
    setDiagnosis("");
    setEstimatedCost("0");
    setHealthAdvice(template.notes);
    setStage("STADIUM_1");
    setRxText(template.items.join("\n"));
    setRxNotes(template.notes);
  }

  function applyTemplate(booking: Booking, nextStage: DiseaseStage) {
    const template = getPrescriptionTemplate(booking.specialty, nextStage);
    setStage(nextStage);
    setRxText(template.items.join("\n"));
    setRxNotes(template.notes);
    if (!healthAdvice.trim()) {
      setHealthAdvice(template.notes);
    }
  }

  function selectedMedicineNames() {
    return rxText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function syncEstimatedMedicineCost(lines: string[]) {
    const total = diabetesMedicines
      .filter((medicine) => lines.some((line) => line.includes(medicine.name)))
      .reduce((sum, medicine) => sum + medicine.price, 0);

    if (total > 0) {
      setEstimatedCost(String(total));
    }
  }

  function toggleMedicine(medicine: { name: string; price: number }) {
    const line = medicineLine(medicine);
    const currentLines = selectedMedicineNames();
    const exists = currentLines.some((item) => item.includes(medicine.name));
    const nextLines = exists
      ? currentLines.filter((item) => !item.includes(medicine.name))
      : [...currentLines, line];

    setRxText(nextLines.join("\n"));
    syncEstimatedMedicineCost(nextLines);
  }

  async function saveReview(booking: Booking) {
    const payload = {
      symptoms: symptoms.trim(),
      diagnosis: diagnosis.trim(),
      estimatedCost: Number(estimatedCost),
      healthAdvice: healthAdvice.trim(),
      stage,
      items: rxText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      notes: rxNotes.trim(),
    };

    const parsed = createDoctorReviewSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Payload review dokter tidak valid";
      setError(message);
      showToast({ tone: "error", title: "Review dokter tidak valid", description: message });
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.submitDoctorReview(booking.id, parsed.data);
      showToast({
        tone: "success",
        title: "Review dokter berhasil dikirim",
        description: "Admin sekarang bisa melihat biaya, resep, dan saran kesehatan.",
      });
      setEditId("");
      await reload();
    } catch (err: any) {
      const message = err?.message || "Gagal menyimpan review dokter";
      setError(message);
      showToast({ tone: "error", title: "Simpan review gagal", description: message });
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <RoleGate allow={["doctor"]}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Review Booking Dokter</h1>
              <p className="mt-1 text-sm text-slate-600">
                Booking di bawah ini sudah ditugaskan admin ke akun dokter yang sedang login.
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
                onClick={() => router.push("/doctor")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kembali
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Hanya booking dengan status <span className="font-semibold text-slate-900">Siap Direview</span> yang bisa
            dikirim balik ke admin.
          </div>

          <div className="mt-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama pasien, rumah sakit, keluhan, diagnosis"
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
                <div className="text-sm font-semibold text-slate-700">Belum ada booking untuk dokter ini</div>
                <div className="mt-1 text-xs text-slate-500">Tunggu admin mengirim booking ke dokter.</div>
              </div>
            ) : null}

            {filtered.map((booking) => {
              const isEditing = editId === booking.id;
              const canReview = booking.status === "CONFIRMED" || booking.status === "REVIEWED_BY_DOCTOR";

              return (
                <div key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-extrabold text-slate-900">
                          {booking.hospitalName} - {booking.userName}
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Dibuat: {fmtDateTime(booking.createdAt)} - Ruangan: {booking.roomName} - Spesialis: {booking.specialty}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openReview(booking)}
                        disabled={!canReview}
                        className={cls(
                          "rounded-xl px-3 py-2 text-xs font-semibold",
                          canReview
                            ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                        )}
                      >
                        {booking.doctorReview ? "Edit Review" : "Isi Review"}
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
                      <div className="text-xs font-semibold text-slate-500">Dokter</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{booking.doctorName}</div>
                      <div className="mt-1 text-xs text-slate-600">{booking.specialty}</div>
                    </div>

                    <div className="sm:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Antrian</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{booking.queueNumber}</div>
                      <div className="mt-1 text-xs text-slate-600">ETA {booking.etaMinutes} menit</div>
                    </div>

                    <div className="sm:col-span-12 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">Keluhan pasien</div>
                      <div className="mt-1 text-sm font-semibold text-slate-800">{booking.complaint}</div>
                    </div>
                  </div>

                  {booking.doctorReview ? (
                    <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                      <div className="text-xs font-semibold text-cyan-800">Review terakhir</div>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-cyan-100 bg-white p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">Diagnosis</div>
                          <div className="mt-1 text-sm font-semibold text-slate-800">{booking.doctorReview.diagnosis}</div>
                        </div>
                        <div className="rounded-xl border border-cyan-100 bg-white p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">Estimasi biaya</div>
                          <div className="mt-1 text-sm font-semibold text-slate-800">
                            Rp {booking.doctorReview.estimatedCost.toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isEditing ? (
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">Form Review Dokter</div>
                          <div className="mt-1 text-xs text-slate-500">
                            Isi diagnosis, biaya, saran kesehatan, dan resep. Hasil ini akan kembali ke panel admin.
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => applyTemplate(booking, "STADIUM_1")}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Stadium 1
                          </button>
                          <button
                            onClick={() => applyTemplate(booking, "STADIUM_2")}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Stadium 2
                          </button>
                          <button
                            onClick={() => applyTemplate(booking, "STADIUM_3")}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Stadium 3
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-12">
                        <div className="sm:col-span-6">
                          <div className="text-xs font-semibold text-slate-700">Gejala yang diamati</div>
                          <textarea
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            rows={4}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            placeholder="Jelaskan gejala atau temuan utama pasien"
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <div className="text-xs font-semibold text-slate-700">Diagnosis</div>
                          <input
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Contoh: Diabetes melitus tipe 2 terkontrol parsial"
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          />

                          <div className="mt-4 text-xs font-semibold text-slate-700">Estimasi biaya</div>
                          <input
                            value={estimatedCost}
                            onChange={(e) => setEstimatedCost(e.target.value)}
                            inputMode="numeric"
                            placeholder="350000"
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          />

                          <div className="mt-4 text-xs font-semibold text-slate-700">Saran kesehatan</div>
                          <input
                            value={healthAdvice}
                            onChange={(e) => setHealthAdvice(e.target.value)}
                            placeholder="Contoh: kurangi gula, jalan kaki ringan, kontrol 1 minggu"
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <div className="text-xs font-semibold text-slate-700">Stadium</div>
                          <select
                            value={stage}
                            onChange={(e) => {
                              const nextStage = e.target.value as DiseaseStage;
                              setStage(nextStage);
                              const template = getPrescriptionTemplate(booking.specialty, nextStage);
                              setRxText(template.items.join("\n"));
                              setRxNotes(template.notes);
                            }}
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          >
                            <option value="STADIUM_1">Stadium 1</option>
                            <option value="STADIUM_2">Stadium 2</option>
                            <option value="STADIUM_3">Stadium 3</option>
                          </select>
                        </div>

                        <div className="sm:col-span-8">
                          <div className="text-xs font-semibold text-slate-700">Catatan resep</div>
                          <input
                            value={rxNotes}
                            onChange={(e) => setRxNotes(e.target.value)}
                            placeholder="Contoh: pantau gula darah puasa dan kontrol 1 minggu"
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>

                        <div className="sm:col-span-12">
                          <div className="text-xs font-semibold text-slate-700">Daftar obat</div>
                          {booking.specialty === "Diabetes" ? (
                            <div className="mt-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="text-xs font-bold text-indigo-900">Pilihan obat diabetes</div>
                                  <div className="mt-1 text-xs text-indigo-700">
                                    Klik obat untuk memasukkan atau menghapus dari daftar resep. Harga ikut dikirim ke admin.
                                  </div>
                                </div>
                                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                                  Total otomatis
                                </div>
                              </div>

                              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                {diabetesMedicines.map((medicine) => {
                                  const selected = rxText.includes(medicine.name);

                                  return (
                                    <button
                                      key={medicine.name}
                                      type="button"
                                      onClick={() => toggleMedicine(medicine)}
                                      className={cls(
                                        "rounded-xl border px-3 py-2 text-left text-xs transition",
                                        selected
                                          ? "border-indigo-300 bg-white text-indigo-900 shadow-sm"
                                          : "border-indigo-100 bg-white/70 text-slate-700 hover:border-indigo-200 hover:bg-white"
                                      )}
                                    >
                                      <div className="font-bold">{medicine.name}</div>
                                      <div className="mt-1 font-semibold text-emerald-600">{formatRupiah(medicine.price)}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                              Pilihan obat otomatis saat ini tersedia untuk dokter spesialis Diabetes.
                            </div>
                          )}

                          <textarea
                            value={rxText}
                            onChange={(e) => setRxText(e.target.value)}
                            rows={6}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            placeholder="Tulis 1 obat per baris"
                          />
                          <div className="mt-2 text-xs text-slate-500">Format: 1 obat per baris.</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => saveReview(booking)}
                          disabled={saving}
                          className={cls(
                            "h-11 rounded-xl px-5 text-sm font-bold text-white shadow-sm",
                            saving ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]"
                          )}
                        >
                          {saving ? "Menyimpan..." : "Kirim Review ke Admin"}
                        </button>

                        <button
                          onClick={() => setEditId("")}
                          className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : null}
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
