"use client";

// Halaman pemilihan rumah sakit.
// Flow utamanya: ambil master data rumah sakit/dokter/ruangan, lalu kirim booking baru ke backend.
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/Navbar";
import { PaymentSimulationModal } from "@/app/components/PaymentSimulationModal";
import { useToast } from "@/app/components/Toast";
import { api } from "@/app/lib/api";
import { getUser } from "@/app/lib/auth";
import { savePendingPaymentSimulation, type PaymentSimulationRecord } from "@/app/lib/payment-simulation";
import { createAdminWalkInBookingSchema, createBookingSchema } from "@/app/lib/schemas";
import { useSessionPreferences } from "@/app/lib/use-preferences";
import type { DoctorRecord, Hospital, HospitalRecord, RoomRecord, Specialty, User } from "@/app/lib/types";

type UserLoc = { lat: number; lng: number };

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(a: UserLoc, b: UserLoc) {
  const earth = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earth * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

function fmtKm(km: number | null) {
  if (km == null || !Number.isFinite(km)) return "-";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
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

function hospitalImageSrc(hospitalId: string) {
  if (hospitalId === "primaya-lu") return "/primaya.png";
  if (hospitalId === "thb") return "/thb2.png";
  return "/thb2.png";
}

function hospitalImageClass(hospitalId: string) {
  if (hospitalId === "thb") {
    return "object-contain p-3 transition duration-500 hover:scale-[1.01]";
  }

  return "object-cover transition duration-500 hover:scale-[1.02]";
}

function buildHospitals(hospitals: HospitalRecord[], doctors: DoctorRecord[]): Hospital[] {
  // Backend mengirim data master terpisah, lalu frontend merakit relasi agar mudah dipakai oleh UI.
  // Ruangan sengaja tidak ditempel di level rumah sakit karena availability sekarang spesifik per dokter.
  return hospitals.map((hospital) => ({
    ...hospital,
    doctors: doctors.filter((doctor) => doctor.hospitalId === hospital.id),
    rooms: [],
  }));
}

const hospitalsCopy = {
  id: {
    adminLabel: "Admin Walk-In Registration",
    userLabel: "Personal Medical Concierge",
    adminTitle: "Bantu pasien daftar langsung ke rumah sakit, dokter, dan ruangan.",
    userTitle: "Pilih rumah sakit, dokter, dan ruangan yang paling tepat untuk kebutuhan Anda.",
    adminSubtitle: "Pendaftaran.",
    userSubtitle: "Hy,Segera lakukan booking untuk mendapatkan dokter spesialis yang tepat sesuai dengan keluhan yang Anda alami.",
    hospitals: "Rumah sakit",
    doctorsAvailable: "Dokter tersedia",
    roomsReady: "Ruangan siap",
    walkInPatient: "Pasien walk-in",
    loadingHospital: "Memuat rumah sakit...",
    noData: "Belum ada data",
    age: "Umur",
    years: "tahun",
    ageEmpty: "Umur pasien belum diisi",
    selectedHospital: "Rumah sakit dipilih",
    hospitalSummary: "Ringkasan rumah sakit",
    selectedDoctor: "Dokter dipilih",
    selectedRoom: "Ruangan dipilih",
    complaint: "Keluhan",
    notSelected: "Belum dipilih",
    empty: "Belum diisi",
    sending: "Mengirim ke backend...",
    registerPatient: "Daftarkan Pasien",
    createBooking: "Buat Booking",
    hospitalList: "Daftar Rumah Sakit",
    hospitalListAdminDesc: "Pilih rumah sakit tujuan sebelum admin melengkapi form pasien.",
    hospitalListDesc: "Pilih lokasi yang paling cocok untuk kebutuhanmu.",
    loadingHospitals: "Memuat data rumah sakit dari backend...",
    noHospitals: "Belum ada rumah sakit dari backend.",
    readyForPatient: "Siap dipilih untuk pendaftaran pasien.",
    fromLocation: "dari lokasimu",
    picked: "Dipilih",
    pick: "Pilih",
    completeAdminForm: "Lengkapi Form Pendaftaran Pasien",
    completeBooking: "Lengkapi Booking",
    completeAdminDesc: "Admin mengisi data pasien, memilih dokter, ruangan, lalu mengirim pendaftaran ke backend.",
    completeBookingDesc: "Pilih dokter, ruangan, lalu kirim form ke backend.",
    patientName: "Nama pasien",
    patientAge: "Umur pasien",
    doctor: "Dokter",
    available: "Tersedia",
    full: "Penuh",
    noDoctor: "Belum ada dokter untuk spesialis ini.",
    room: "Ruangan",
    ready: "Siap",
    pickDoctorFirst: "Pilih dokter dulu untuk melihat ruangan yang berlaku khusus untuk dokter tersebut.",
    noRoom: "Belum ada ruangan yang terhubung ke dokter ini.",
    adminComplaint: "Keluhan atau catatan admin",
    shortComplaint: "Keluhan singkat",
    complaintPlaceholder: "Jelaskan kebutuhan pemeriksaan atau keluhan utama",
    defaultComplaint: "Kontrol rutin Diabstrok",
    adminDefaultComplaint: "Pendaftaran langsung pasien di rumah sakit",
    loadHospitalsError: "Gagal memuat data rumah sakit",
    loadRoomsError: "Gagal memuat ruangan dokter",
    hospitalNotReady: "Data rumah sakit belum siap.",
    incompleteBooking: "Data booking belum lengkap.",
    doctorUnavailable: "Dokter tidak tersedia.",
    roomUnavailable: "Ruangan tidak tersedia.",
    adminSuccessTitle: "Pendaftaran pasien berhasil dibuat",
    userSuccessTitle: "Booking berhasil dibuat",
    adminSuccessDesc: "Data pasien walk-in sudah masuk ke backend resmi.",
    userSuccessDesc: "Data booking sudah dikirim ke backend resmi.",
    createError: "Gagal membuat booking",
    createErrorTitle: "Booking gagal",
    paymentTitle: "Pembayaran Simulasi QR",
    paymentSubtitle: "Scan QR ini sebagai simulasi pembayaran booking rumah sakit, lalu lanjutkan unggah bukti agar admin bisa memverifikasinya.",
    paymentPending: "Menunggu pembayaran",
    confirmPayment: "Lanjut upload bukti",
    payLater: "Nanti saja",
    paymentConfirmedTitle: "Booking siap unggah bukti bayar",
    paymentConfirmedDesc: "Lanjutkan ke riwayat booking untuk upload foto bukti pembayaran sebelum admin meneruskan ke dokter.",
    paymentLaterTitle: "Pembayaran bisa dilanjutkan nanti",
    paymentLaterDesc: "Booking tetap dibuat dan bisa kamu bayar dari halaman My Bookings.",
    summaryHospital: "Rumah sakit",
    summaryDoctor: "Dokter",
    summaryRoom: "Ruangan",
    summaryTotal: "Total simulasi",
  },
  en: {
    adminLabel: "Admin Walk-In Registration",
    userLabel: "Personal Medical Concierge",
    adminTitle: "Help patients register directly to a hospital, doctor, and room.",
    userTitle: "Choose the right hospital, doctor, and room for your needs.",
    adminSubtitle: "Registration.",
    userSubtitle: "Book now to get the right specialist based on your complaint.",
    hospitals: "Hospitals",
    doctorsAvailable: "Available Doctors",
    roomsReady: "Ready Rooms",
    walkInPatient: "Walk-in patient",
    loadingHospital: "Loading hospital...",
    noData: "No data yet",
    age: "Age",
    years: "years",
    ageEmpty: "Patient age not filled",
    selectedHospital: "Selected hospital",
    hospitalSummary: "Hospital summary",
    selectedDoctor: "Selected doctor",
    selectedRoom: "Selected room",
    complaint: "Complaint",
    notSelected: "Not selected",
    empty: "Not filled",
    sending: "Sending to backend...",
    registerPatient: "Register Patient",
    createBooking: "Create Booking",
    hospitalList: "Hospital List",
    hospitalListAdminDesc: "Choose the destination hospital before admin completes the patient form.",
    hospitalListDesc: "Choose the best location for your needs.",
    loadingHospitals: "Loading hospital data from backend...",
    noHospitals: "No hospitals from backend yet.",
    readyForPatient: "Ready for patient registration.",
    fromLocation: "from your location",
    picked: "Selected",
    pick: "Select",
    completeAdminForm: "Complete Patient Registration Form",
    completeBooking: "Complete Booking",
    completeAdminDesc: "Admin fills patient data, chooses doctor and room, then sends registration to backend.",
    completeBookingDesc: "Choose a doctor and room, then send the form to backend.",
    patientName: "Patient name",
    patientAge: "Patient age",
    doctor: "Doctor",
    available: "Available",
    full: "Full",
    noDoctor: "No doctor for this specialty yet.",
    room: "Room",
    ready: "Ready",
    pickDoctorFirst: "Select a doctor first to see rooms specific to that doctor.",
    noRoom: "No rooms connected to this doctor yet.",
    adminComplaint: "Admin complaint or note",
    shortComplaint: "Short complaint",
    complaintPlaceholder: "Describe the examination need or main complaint",
    defaultComplaint: "Routine Diabstrok control",
    adminDefaultComplaint: "Direct patient registration at hospital",
    loadHospitalsError: "Failed to load hospital data",
    loadRoomsError: "Failed to load doctor rooms",
    hospitalNotReady: "Hospital data is not ready.",
    incompleteBooking: "Booking data is incomplete.",
    doctorUnavailable: "Doctor is unavailable.",
    roomUnavailable: "Room is unavailable.",
    adminSuccessTitle: "Patient registration created",
    userSuccessTitle: "Booking created",
    adminSuccessDesc: "Walk-in patient data has entered the official backend.",
    userSuccessDesc: "Booking data has been sent to the official backend.",
    createError: "Failed to create booking",
    createErrorTitle: "Booking failed",
    paymentTitle: "QR Payment Simulation",
    paymentSubtitle: "Scan this QR as a hospital booking payment simulation. Then press confirm so the booking is marked as paid.",
    paymentPending: "Awaiting payment",
    confirmPayment: "Continue to proof upload",
    payLater: "Later",
    paymentConfirmedTitle: "Booking ready for payment proof upload",
    paymentConfirmedDesc: "Continue to My Bookings to upload payment proof before admin forwards it to the doctor.",
    paymentLaterTitle: "You can pay later",
    paymentLaterDesc: "The booking was still created and can be paid later from the My Bookings page.",
    summaryHospital: "Hospital",
    summaryDoctor: "Doctor",
    summaryRoom: "Room",
    summaryTotal: "Simulation total",
  },
};

export default function HospitalsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { language, darkMode } = useSessionPreferences();
  const copy = hospitalsCopy[language];

  const [viewer, setViewer] = useState<User | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [specialty, setSpecialty] = useState<Specialty>("Diabetes");
  const [doctorId, setDoctorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [complaint, setComplaint] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userLoc, setUserLoc] = useState<UserLoc | null>(null);
  const [locError, setLocError] = useState("");
  const [paymentDraft, setPaymentDraft] = useState<PaymentSimulationRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isAdmin = viewer?.role === "admin";

  useEffect(() => {
    // Session dibaca di client agar halaman bisa berganti mode antara user biasa dan admin.
    setViewer(getUser());
    setComplaint(copy.defaultComplaint);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Admin dibantu dengan draft catatan awal yang lebih cocok untuk pasien walk-in.
    setComplaint((current) =>
      !current || current === hospitalsCopy.id.defaultComplaint || current === hospitalsCopy.en.defaultComplaint
        ? copy.adminDefaultComplaint
        : current
    );
  }, [copy.adminDefaultComplaint, isAdmin]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Semua pilihan booking diambil dari backend agar frontend tidak lagi menjadi sumber data utama.
      setLoading(true);
      setError("");

      try {
        const [hospitalsRes, doctorsRes] = await Promise.all([
          api.listHospitals(),
          api.listDoctors(),
        ]);

        if (!mounted) return;

        const nextHospitals = buildHospitals(hospitalsRes.items, doctorsRes.items);
        setHospitals(nextHospitals);

        const params = new URLSearchParams(window.location.search);
        const hid = params.get("hid");
        const spec = params.get("spec");

        if (spec === "Umum" || spec === "Diabetes" || spec === "Stroke") {
          setSpecialty(spec);
        }

        if (hid && nextHospitals.some((hospital) => hospital.id === hid)) {
          setSelectedHospitalId(hid);
        } else {
          setSelectedHospitalId(nextHospitals[0]?.id || "");
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || copy.loadHospitalsError);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRoomsForDoctor() {
      if (!selectedHospitalId || !doctorId) {
        setRooms([]);
        return;
      }

      try {
        // Availability ruangan dibaca berdasarkan kombinasi doctorId dan roomId.
        // Dengan begitu, satu ruangan bisa penuh untuk dokter tertentu saja.
        const res = await api.listRooms({
          hospitalId: selectedHospitalId,
          doctorId,
        });

        if (!mounted) return;
        setRooms(res.items);
      } catch (err: any) {
        if (!mounted) return;
        setRooms([]);
        setError(err?.message || copy.loadRoomsError);
      }
    }

    loadRoomsForDoctor();
    return () => {
      mounted = false;
    };
  }, [selectedHospitalId, doctorId]);

  useEffect(() => {
    if (getUser()?.role === "admin") {
      return;
    }

    if (!navigator.geolocation) {
      setLocError("Browser kamu tidak mendukung lokasi.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocError("Izin lokasi ditolak. Aktifkan lokasi untuk lihat jarak.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  const hospitalsWithDistance = useMemo(() => {
    const items = hospitals.map((hospital) => ({
      ...hospital,
      km: userLoc ? distanceKm(userLoc, { lat: hospital.lat, lng: hospital.lng }) : null,
    }));

    items.sort((a, b) => {
      if (a.km == null && b.km == null) return 0;
      if (a.km == null) return 1;
      if (b.km == null) return -1;
      return a.km - b.km;
    });

    return items;
  }, [hospitals, userLoc]);

  const hospital = useMemo(() => {
    return hospitalsWithDistance.find((item) => item.id === selectedHospitalId) || hospitalsWithDistance[0] || null;
  }, [hospitalsWithDistance, selectedHospitalId]);

  const doctorsFiltered = useMemo(() => {
    return hospital?.doctors.filter((doctor) => doctor.specialty === specialty) || [];
  }, [hospital, specialty]);

  const chosenDoctor = useMemo(() => {
    return hospital?.doctors.find((doctor) => doctor.id === doctorId) || null;
  }, [doctorId, hospital]);

  const chosenRoom = useMemo(() => {
    return rooms.find((room) => room.id === roomId) || null;
  }, [roomId, rooms]);

  const hospitalStats = useMemo(() => {
    if (!hospital) {
      return {
        availableDoctors: 0,
        availableRooms: 0,
      };
    }

    return {
      availableDoctors: hospital.doctors.filter((doctor) => doctor.available).length,
      availableRooms: rooms.filter((room) => room.available).length,
    };
  }, [hospital, rooms]);

  function handlePickHospital(id: string) {
    setSelectedHospitalId(id);
    setDoctorId("");
    setRoomId("");
    setRooms([]);
    setError("");
  }

  async function handleBook() {
    // Booking hanya boleh dibuat oleh user atau admin yang sudah login.
    if (!hospital) {
      setError(copy.hospitalNotReady);
      return;
    }

    const user = getUser();
    if (!user) {
      const backUrl = `/hospitals?hid=${encodeURIComponent(hospital.id)}&spec=${encodeURIComponent(specialty)}`;
      router.push(`/signin?callbackUrl=${encodeURIComponent(backUrl)}`);
      return;
    }

    const basePayload = {
      hospitalId: hospital.id,
      doctorId,
      roomId,
      complaint,
    };
    const parsed = isAdmin
      ? createAdminWalkInBookingSchema.safeParse({
          ...basePayload,
          patientName,
          patientAge: Number(patientAge),
        })
      : createBookingSchema.safeParse(basePayload);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || copy.incompleteBooking);
      return;
    }

    if (!chosenDoctor?.available) {
      setError(copy.doctorUnavailable);
      return;
    }

    if (!chosenRoom?.available) {
      setError(copy.roomUnavailable);
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Payload booking dikirim ke backend NestJS untuk divalidasi dan disimpan.
      const res = await api.createBooking(parsed.data);
      showToast({
        tone: "success",
        title: isAdmin ? copy.adminSuccessTitle : copy.userSuccessTitle,
        description: isAdmin
          ? copy.adminSuccessDesc
          : copy.userSuccessDesc,
      });

      if (isAdmin) {
        router.push("/admin/bookings");
        return;
      }

      // User biasa diarahkan dulu ke simulasi QR agar alur demo pembayaran terasa utuh.
      const payment = savePendingPaymentSimulation(res.item);
      setPaymentDraft(payment);
      setShowPaymentModal(true);
    } catch (err: any) {
      const message = err?.message || copy.createError;
      setError(message);
      showToast({ tone: "error", title: copy.createErrorTitle, description: message });
    } finally {
      setSaving(false);
    }
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    showToast({
      tone: "success",
      title: copy.paymentLaterTitle,
      description: copy.paymentLaterDesc,
    });
    router.push("/my-bookings");
  }

  function confirmPaymentAndContinue() {
    setShowPaymentModal(false);
    showToast({
      tone: "success",
      title: copy.paymentConfirmedTitle,
      description: copy.paymentConfirmedDesc,
    });
    router.push("/my-bookings");
  }

  return (
    <div
      className={cls(
        "min-h-screen",
        darkMode
          ? "bg-[radial-gradient(circle_at_top,#172554_0%,#020617_46%,#020617_100%)] text-slate-100"
          : "bg-[radial-gradient(circle_at_top,#dff7f3_0%,#eff8ff_38%,#f8fafc_72%)] text-slate-900",
      )}
    >
      <Navbar />
      <PaymentSimulationModal
        open={showPaymentModal}
        title={copy.paymentTitle}
        subtitle={copy.paymentSubtitle}
        pendingText={copy.paymentPending}
        confirmText={copy.confirmPayment}
        laterText={copy.payLater}
        summaryLabels={{
          hospital: copy.summaryHospital,
          doctor: copy.summaryDoctor,
          room: copy.summaryRoom,
          total: copy.summaryTotal,
        }}
        payment={paymentDraft}
        onClose={closePaymentModal}
        onConfirm={confirmPaymentAndContinue}
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.38)] backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-700">
              {isAdmin ? copy.adminLabel : copy.userLabel}
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {isAdmin
                ? copy.adminTitle
                : copy.userTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {isAdmin
                ? copy.adminSubtitle
                : copy.userSubtitle}
            </p>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {locError ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {locError}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.hospitals}</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{loading ? "..." : hospitals.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.doctorsAvailable}</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{hospitalStats.availableDoctors}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.roomsReady}</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{hospitalStats.availableRooms}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.78)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-200/80">Ringkasan</div>
            <div className="mt-3 text-2xl font-black leading-tight">
              {isAdmin
                ? patientName.trim() || copy.walkInPatient
                : hospital
                ? hospital.name
                : loading
                ? copy.loadingHospital
                : copy.noData}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              {isAdmin
                ? patientAge.trim()
                  ? `${copy.age} ${patientAge.trim()} ${copy.years}`
                  : copy.ageEmpty
                : hospital
                ? `${fmtKm((hospital as Hospital & { km?: number | null }).km ?? null)} dari lokasimu`
                : "-"}
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {isAdmin ? copy.selectedHospital : copy.hospitalSummary}
                </div>
                <div className="mt-2 text-sm font-semibold">{hospital ? hospital.name : copy.notSelected}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{copy.selectedDoctor}</div>
                <div className="mt-2 text-sm font-semibold">{chosenDoctor ? chosenDoctor.name : copy.notSelected}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{copy.selectedRoom}</div>
                <div className="mt-2 text-sm font-semibold">{chosenRoom ? chosenRoom.name : copy.notSelected}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{copy.complaint}</div>
                <div className="mt-2 text-sm font-semibold">{complaint.trim() || copy.empty}</div>
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={saving || loading || !hospital}
              className={cls(
                "mt-6 h-12 w-full rounded-2xl text-sm font-bold shadow-sm transition",
                saving || loading || !hospital
                  ? "cursor-not-allowed bg-slate-700 text-slate-300"
                  : "bg-teal-400 text-slate-950 hover:bg-teal-300"
              )}
            >
              {saving ? copy.sending : isAdmin ? copy.registerPatient : copy.createBooking}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">{copy.hospitalList}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {isAdmin
                    ? copy.hospitalListAdminDesc
                    : copy.hospitalListDesc}
                </div>
              </div>

              <select
                value={specialty}
                onChange={(e) => {
                  setSpecialty(e.target.value as Specialty);
                  setDoctorId("");
                  setRoomId("");
                  setRooms([]);
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              >
                <option value="Umum">Umum</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Stroke">Stroke</option>
              </select>
            </div>

            <div className="mt-5 grid gap-4">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  {copy.loadingHospitals}
                </div>
              ) : null}

              {!loading && hospitalsWithDistance.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  {copy.noHospitals}
                </div>
              ) : null}

              {hospitalsWithDistance.map((item) => {
                const active = item.id === hospital?.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handlePickHospital(item.id)}
                    className={cls(
                      "rounded-[1.5rem] border p-5 text-left transition",
                      active
                        ? "border-teal-200 bg-teal-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="overflow-hidden rounded-[1.2rem]">
                      <div className={cls("relative h-44 w-full", item.id === "thb" && "bg-white")}>
                        <Image
                          src={hospitalImageSrc(item.id)}
                          alt={item.name}
                          fill
                          className={hospitalImageClass(item.id)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-slate-950">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {isAdmin ? copy.readyForPatient : `${fmtKm(item.km)} ${copy.fromLocation}`}
                        </div>
                      </div>
                      <div
                        className={cls(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          active ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {active ? copy.picked : copy.pick}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-bold text-slate-900">
              {isAdmin ? copy.completeAdminForm : copy.completeBooking}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {isAdmin
                ? copy.completeAdminDesc
                : copy.completeBookingDesc}
            </div>

            <div className="mt-5 grid gap-5">
              {isAdmin ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.patientName}</label>
                    <input
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.patientAge}</label>
                    <input
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value.replace(/[^\d]/g, ""))}
                      inputMode="numeric"
                      className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                      placeholder="Contoh: 54"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.doctor}</div>
                <div className="mt-3 grid gap-3">
                  {doctorsFiltered.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => {
                        setDoctorId(doctor.id);
                        setRoomId("");
                      }}
                      className={cls(
                        "flex items-center gap-4 rounded-2xl border p-4 text-left transition",
                        doctorId === doctor.id
                          ? "border-teal-200 bg-teal-50"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                        !doctor.available && "opacity-60"
                      )}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                        {initials(doctor.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900">{doctor.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{doctor.specialty}</div>
                      </div>
                      <div
                        className={cls(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          doctor.available ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}
                      >
                        {doctor.available ? copy.available : copy.full}
                      </div>
                    </button>
                  ))}

                  {doctorsFiltered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      {copy.noDoctor}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.room}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setRoomId(room.id)}
                      className={cls(
                        "rounded-2xl border p-4 text-left transition",
                        roomId === room.id ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-white hover:bg-slate-50",
                        !room.available && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{room.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{room.type}</div>
                        </div>
                        <div
                          className={cls(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            room.available ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          )}
                        >
                          {room.available ? copy.ready : copy.full}
                        </div>
                      </div>
                    </button>
                  ))}

                  {!doctorId ? (
                    <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      {copy.pickDoctorFirst}
                    </div>
                  ) : null}

                  {doctorId && rooms.length === 0 ? (
                    <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      {copy.noRoom}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {isAdmin ? copy.adminComplaint : copy.shortComplaint}
                </label>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  rows={5}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                  placeholder={copy.complaintPlaceholder}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
