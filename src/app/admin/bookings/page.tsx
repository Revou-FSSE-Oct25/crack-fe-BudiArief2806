"use client";

// Halaman operasional admin untuk mengirim booking ke dokter,
// memantau hasil review dokter, lalu menutup kasus.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGate } from "@/app/components/RoleGate";
import { useToast } from "@/app/components/Toast";
import { api } from "@/app/lib/api";
import { confirmPaymentSimulation, getPaymentSimulation } from "@/app/lib/payment-simulation";
import { useSessionPreferences } from "@/app/lib/use-preferences";
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

const adminBookingsCopy = {
  id: {
    title: "Admin Booking Rumah Sakit",
    subtitle: "Admin menilai keluhan awal, mengirim booking ke dokter, lalu menutup kasus setelah hasil dokter masuk.",
    refresh: "Refresh",
    back: "Kembali",
    totalBooking: "Total booking",
    pendingTriage: "Pending triage",
    reviewDone: "Menunggu dan selesai review dokter",
    search: "Cari nama, email, dokter, RS, keluhan, status, diagnosis",
    loading: "Memuat booking dari backend...",
    emptyTitle: "Belum ada booking",
    emptyDesc: "Coba buat booking dari halaman `/hospitals`",
    sendDoctor: "Kirim ke Dokter",
    verifyPayment: "Verifikasi Pembayaran",
    waitingPayment: "Menunggu Bukti Bayar",
    completeCase: "Selesaikan Kasus",
    delete: "Hapus",
    patient: "Pasien",
    age: "Umur",
    years: "tahun",
    noEmail: "Didaftarkan admin tanpa email",
    room: "Ruangan",
    specialty: "Spesialis",
    complaint: "Keluhan singkat",
    paymentProof: "Bukti pembayaran",
    paymentPending: "User belum mengirim bukti pembayaran.",
    paymentWaitingAdmin: "Bukti pembayaran sudah dikirim dan menunggu verifikasi admin.",
    paymentVerified: "Pembayaran sudah diverifikasi admin. Booking boleh diteruskan ke dokter.",
    uploadTime: "Waktu upload",
    notSent: "Admin belum mengirim booking ini ke dokter.",
    waitingReview: "Booking sudah dikirim ke dokter. Menunggu hasil pemeriksaan.",
    noReview: "Belum ada hasil review dokter.",
    symptoms: "Gejala yang diamati dokter",
    diagnosisCost: "Diagnosis dan estimasi biaya",
    estimatedCost: "Estimasi biaya",
    healthAdvice: "Saran menjaga kesehatan",
    prescription: "Resep dari Dokter",
    createdBy: "Dibuat oleh",
    notes: "Catatan",
    made: "Dibuat",
    queue: "Antrian",
    minutes: "menit",
    statusPending: "Pending Triage Admin",
    statusSent: "Sudah Dikirim ke Dokter",
    statusReviewed: "Hasil Dokter Masuk",
    statusCompleted: "Selesai",
    loadError: "Gagal memuat booking admin",
    loadErrorTitle: "Gagal memuat data admin",
    statusUpdated: "Status booking diperbarui",
    paymentVerifiedTitle: "Pembayaran diverifikasi",
    paymentVerifiedDesc: "Admin sekarang bisa meneruskan booking ke dokter.",
    sentDesc: "Booking sudah dikirim ke dokter yang dipilih.",
    completedDesc: "Kasus sudah ditutup oleh admin.",
    updateError: "Gagal mengubah status booking",
    updateErrorTitle: "Update status gagal",
    confirmDelete: "Hapus booking ini dari panel admin?",
    deleteSuccess: "Booking dihapus",
    deleteDesc: "Data booking sudah dihapus dari backend.",
    deleteError: "Gagal menghapus booking",
    deleteErrorTitle: "Hapus booking gagal",
  },
  en: {
    title: "Hospital Booking Admin",
    subtitle: "Admin reviews the initial complaint, sends bookings to doctors, then closes cases after doctor results arrive.",
    refresh: "Refresh",
    back: "Back",
    totalBooking: "Total bookings",
    pendingTriage: "Pending triage",
    reviewDone: "Waiting and completed doctor reviews",
    search: "Search name, email, doctor, hospital, complaint, status, diagnosis",
    loading: "Loading bookings from backend...",
    emptyTitle: "No bookings yet",
    emptyDesc: "Try creating a booking from the `/hospitals` page",
    sendDoctor: "Send to Doctor",
    verifyPayment: "Verify Payment",
    waitingPayment: "Waiting for Payment Proof",
    completeCase: "Complete Case",
    delete: "Delete",
    patient: "Patient",
    age: "Age",
    years: "years",
    noEmail: "Registered by admin without email",
    room: "Room",
    specialty: "Specialty",
    complaint: "Short complaint",
    paymentProof: "Payment proof",
    paymentPending: "The user has not uploaded payment proof yet.",
    paymentWaitingAdmin: "Payment proof has been uploaded and is waiting for admin verification.",
    paymentVerified: "Payment has been verified by admin. The booking can now be sent to the doctor.",
    uploadTime: "Uploaded at",
    notSent: "Admin has not sent this booking to the doctor.",
    waitingReview: "Booking has been sent to the doctor. Waiting for examination result.",
    noReview: "No doctor review yet.",
    symptoms: "Symptoms observed by doctor",
    diagnosisCost: "Diagnosis and cost estimate",
    estimatedCost: "Estimated cost",
    healthAdvice: "Health advice",
    prescription: "Prescription from Doctor",
    createdBy: "Created by",
    notes: "Notes",
    made: "Created",
    queue: "Queue",
    minutes: "minutes",
    statusPending: "Pending Admin Triage",
    statusSent: "Sent to Doctor",
    statusReviewed: "Doctor Result Received",
    statusCompleted: "Completed",
    loadError: "Failed to load admin bookings",
    loadErrorTitle: "Failed to load admin data",
    statusUpdated: "Booking status updated",
    paymentVerifiedTitle: "Payment verified",
    paymentVerifiedDesc: "Admin can now forward the booking to the doctor.",
    sentDesc: "Booking has been sent to the selected doctor.",
    completedDesc: "The case has been closed by admin.",
    updateError: "Failed to update booking status",
    updateErrorTitle: "Status update failed",
    confirmDelete: "Delete this booking from admin panel?",
    deleteSuccess: "Booking deleted",
    deleteDesc: "Booking data has been deleted from backend.",
    deleteError: "Failed to delete booking",
    deleteErrorTitle: "Delete booking failed",
  },
};

function StatusBadge({ status, copy }: { status: BookingStatus; copy: typeof adminBookingsCopy.id }) {
  const cfg =
    status === "PENDING"
      ? { text: copy.statusPending, cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" }
      : status === "CONFIRMED"
      ? { text: copy.statusSent, cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" }
      : status === "REVIEWED_BY_DOCTOR"
      ? { text: copy.statusReviewed, cls: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" }
      : { text: copy.statusCompleted, cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" };

  return (
    <span className={cls("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", cfg.cls)}>
      {cfg.text}
    </span>
  );
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { language, darkMode } = useSessionPreferences();
  const copy = adminBookingsCopy[language];
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
      const message = err?.message || copy.loadError;
      setError(message);
      showToast({ tone: "error", title: copy.loadErrorTitle, description: message });
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
        title: copy.statusUpdated,
        description:
          status === "CONFIRMED"
            ? copy.sentDesc
            : status === "COMPLETED"
            ? copy.completedDesc
            : `Status terbaru: ${status}.`,
      });
      await reload();
    } catch (err: any) {
      const message = err?.message || copy.updateError;
      setError(message);
      showToast({ tone: "error", title: copy.updateErrorTitle, description: message });
    }
  }

  async function remove(id: string) {
    if (!window.confirm(copy.confirmDelete)) {
      return;
    }

    try {
      await api.deleteBooking(id);
      showToast({
        tone: "success",
        title: copy.deleteSuccess,
        description: copy.deleteDesc,
      });
      await reload();
    } catch (err: any) {
      const message = err?.message || copy.deleteError;
      setError(message);
      showToast({ tone: "error", title: copy.deleteErrorTitle, description: message });
    }
  }

  function verifyPayment(bookingId: string) {
    confirmPaymentSimulation(bookingId);
    setItems((current) => [...current]);
    showToast({
      tone: "success",
      title: copy.paymentVerifiedTitle,
      description: copy.paymentVerifiedDesc,
    });
  }

  if (!ready) return null;

  const pendingCount = items.filter((item) => item.status === "PENDING").length;
  const sentCount = items.filter((item) => item.status === "CONFIRMED").length;
  const reviewedCount = items.filter((item) => item.status === "REVIEWED_BY_DOCTOR").length;

  return (
    <RoleGate allow={["admin"]}>
      <div className={cls("min-h-screen text-slate-900", darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50")}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{copy.title}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {copy.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => reload()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copy.refresh}
              </button>

              <button
                onClick={() => router.push("/admin")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copy.back}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">{copy.totalBooking}</div>
              <div className="mt-1 text-2xl font-extrabold">{items.length}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">{copy.pendingTriage}</div>
              <div className="mt-1 text-2xl font-extrabold">{pendingCount}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">{copy.reviewDone}</div>
              <div className="mt-1 text-2xl font-extrabold">{sentCount + reviewedCount}</div>
            </div>
          </div>

          <div className="mt-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={copy.search}
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
              {copy.loading}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            {!loading && filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
                <div className="text-sm font-semibold text-slate-700">{copy.emptyTitle}</div>
                <div className="mt-1 text-xs text-slate-500">{copy.emptyDesc}</div>
              </div>
            ) : null}

            {filtered.map((booking) => {
              const payment = getPaymentSimulation(booking.id);
              const canSendToDoctor = booking.status === "PENDING" && payment?.status === "verified";
              const canComplete = booking.status === "REVIEWED_BY_DOCTOR";

              return (
                <div key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-extrabold text-slate-900">
                          {booking.hospitalName} - {booking.doctorName}
                        </div>
                        <StatusBadge status={booking.status} copy={copy} />
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {copy.made}: {fmtDateTime(booking.createdAt)} - {copy.queue}: {booking.queueNumber} - ETA: {booking.etaMinutes} {copy.minutes}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {booking.status === "PENDING" && payment?.status === "proof_uploaded" ? (
                        <button
                          onClick={() => verifyPayment(booking.id)}
                          className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                        >
                          {copy.verifyPayment}
                        </button>
                      ) : null}

                      {canSendToDoctor ? (
                        <button
                          onClick={() => setStatus(booking.id, "CONFIRMED")}
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          {copy.sendDoctor}
                        </button>
                      ) : booking.status === "PENDING" ? (
                        <button
                          disabled
                          className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500"
                        >
                          {copy.waitingPayment}
                        </button>
                      ) : null}

                      {canComplete ? (
                        <button
                          onClick={() => setStatus(booking.id, "COMPLETED")}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          {copy.completeCase}
                        </button>
                      ) : null}

                      <button
                        onClick={() => remove(booking.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        {copy.delete}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">{copy.patient}</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{booking.userName}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {booking.patientAge ? `${copy.age} ${booking.patientAge} ${copy.years}` : booking.userEmail || copy.noEmail}
                      </div>
                    </div>

                    <div className="sm:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">{copy.room}</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{booking.roomName}</div>
                      <div className="mt-1 text-xs text-slate-600">{booking.roomType}</div>
                    </div>

                    <div className="sm:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">{copy.specialty}</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{booking.specialty}</div>
                      <div className="mt-1 text-xs text-slate-600">ID: {booking.id}</div>
                    </div>

                    <div className="sm:col-span-12 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">{copy.complaint}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-800">{booking.complaint}</div>
                    </div>

                    <div className="sm:col-span-12 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">{copy.paymentProof}</div>
                      <div className="mt-2 text-sm text-slate-700">
                        {payment?.status === "verified"
                          ? copy.paymentVerified
                          : payment?.status === "proof_uploaded"
                          ? copy.paymentWaitingAdmin
                          : copy.paymentPending}
                      </div>

                      {payment?.proofUploadedAt ? (
                        <div className="mt-2 text-xs text-slate-500">
                          {copy.uploadTime}: {fmtDateTime(payment.proofUploadedAt)}
                        </div>
                      ) : null}

                      {payment?.proofImage ? (
                        <div className="mt-4">
                          {/* Admin membaca gambar bukti langsung dari browser untuk simulasi proses verifikasi. */}
                          <img
                            src={payment.proofImage}
                            alt="Bukti pembayaran user"
                            className="h-52 rounded-2xl border border-slate-200 bg-white object-cover"
                          />
                        </div>
                      ) : null}
                    </div>

                    {!booking.doctorReview ? (
                      <div className="sm:col-span-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        {booking.status === "PENDING"
                          ? copy.notSent
                          : booking.status === "CONFIRMED"
                          ? copy.waitingReview
                          : copy.noReview}
                      </div>
                    ) : (
                      <>
                        <div className="sm:col-span-6 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                          <div className="text-xs font-semibold text-cyan-800">{copy.symptoms}</div>
                          <div className="mt-2 text-sm text-slate-800">{booking.doctorReview.symptoms}</div>
                        </div>

                        <div className="sm:col-span-6 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                          <div className="text-xs font-semibold text-cyan-800">{copy.diagnosisCost}</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{booking.doctorReview.diagnosis}</div>
                          <div className="mt-1 text-sm text-slate-700">
                            {copy.estimatedCost}: Rp {booking.doctorReview.estimatedCost.toLocaleString("id-ID")}
                          </div>
                        </div>

                        <div className="sm:col-span-12 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                          <div className="text-xs font-semibold text-cyan-800">{copy.healthAdvice}</div>
                          <div className="mt-2 text-sm text-slate-800">{booking.doctorReview.healthAdvice}</div>
                        </div>
                      </>
                    )}

                    {booking.prescription ? (
                      <div className="sm:col-span-12 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-indigo-800">{copy.prescription}</div>
                          <div className="text-xs text-indigo-700">{copy.createdBy} {booking.prescription.createdBy}</div>
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
                            {copy.notes}: <span className="font-semibold">{booking.prescription.notes}</span>
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
