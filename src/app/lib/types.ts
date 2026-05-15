// Kumpulan type frontend.
// Type di file ini menyamakan kontrak data antara halaman UI dan response backend.
export type Role = "admin" | "doctor" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified?: boolean;
  googleId?: string;
  doctorId?: string;
};

export type Specialty = "Umum" | "Diabetes" | "Stroke";
export type BookingStatus = "PENDING" | "CONFIRMED" | "REVIEWED_BY_DOCTOR" | "COMPLETED";
export type DiseaseStage = "STADIUM_1" | "STADIUM_2" | "STADIUM_3";
export type RoomType = "VIP" | "Kelas 1" | "Kelas 2" | "ICU";

export type HospitalRecord = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type DoctorRecord = {
  id: string;
  hospitalId: string;
  name: string;
  specialty: Specialty;
  available: boolean;
};

export type RoomRecord = {
  id: string;
  hospitalId: string;
  doctorId?: string;
  name: string;
  type: RoomType;
  available: boolean;
};

export type Hospital = HospitalRecord & {
  doctors: DoctorRecord[];
  rooms: RoomRecord[];
};

export type Prescription = {
  stage: DiseaseStage;
  items: string[];
  notes: string;
  createdAt: string;
  createdBy: "admin" | "doctor";
};

export type DoctorReview = {
  symptoms: string;
  diagnosis: string;
  estimatedCost: number;
  healthAdvice: string;
  createdAt: string;
  updatedAt: string;
  createdBy: "doctor";
};

export type BookingMessage = {
  id: string;
  bookingId: string;
  senderUserId: string;
  senderRole: Role;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  userId?: string | null;
  patientName: string;
  patientAge?: number | null;
  userName: string;
  userEmail?: string;
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  specialty: Specialty;
  roomId: string;
  roomName: string;
  roomType: RoomType;
  complaint: string;
  status: BookingStatus;
  createdAt: string;
  queueNumber: number;
  etaMinutes: number;
  prescription?: Prescription;
  doctorReview?: DoctorReview;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  role: Role;
  user: User;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  user: User;
  requiresEmailVerification?: boolean;
  verificationUrl?: string;
};

export type AuthMeResponse = {
  user: User;
};

export type VerifyEmailResponse = {
  verified: true;
  user: User;
};

export type CreateBookingRequest = {
  hospitalId: string;
  doctorId: string;
  roomId: string;
  complaint: string;
  patientName?: string;
  patientAge?: number;
};

export type UpdateBookingStatusRequest = {
  status: BookingStatus;
};

export type CreatePrescriptionRequest = {
  stage: DiseaseStage;
  items: string[];
  notes: string;
};

export type CreateDoctorReviewRequest = {
  symptoms: string;
  diagnosis: string;
  estimatedCost: number;
  healthAdvice: string;
  stage: DiseaseStage;
  items: string[];
  notes: string;
};

export type CreateBookingMessageRequest = {
  message: string;
};

export type ApiListResponse<T> = {
  items: T[];
};

export type ApiItemResponse<T> = {
  item: T;
};

export function stageLabel(stage: DiseaseStage) {
  return stage === "STADIUM_1" ? "Stadium 1" : stage === "STADIUM_2" ? "Stadium 2" : "Stadium 3";
}

export function bookingStatusLabel(status: BookingStatus) {
  if (status === "PENDING") return "Pending";
  if (status === "CONFIRMED") return "Dikirim ke Dokter";
  if (status === "REVIEWED_BY_DOCTOR") return "Sudah Direview Dokter";
  return "Selesai";
}

export function getPrescriptionTemplate(specialty: Specialty, stage: DiseaseStage) {
  const base = {
    stage,
    items: [] as string[],
    notes: "",
  };

  if (specialty === "Diabetes") {
    if (stage === "STADIUM_1") {
      base.items = ["Metformin 500mg 2x sehari setelah makan", "Vitamin B Kompleks 1x sehari"];
      base.notes = "Edukasi diet, kurangi gula. Kontrol 2 minggu.";
    }
    if (stage === "STADIUM_2") {
      base.items = [
        "Metformin 500mg 2x sehari setelah makan",
        "Glimepiride 1mg 1x sehari pagi",
        "Atorvastatin 10mg 1x malam",
      ];
      base.notes = "Pantau gula puasa dan 2 jam PP. Kontrol 1 minggu.";
    }
    if (stage === "STADIUM_3") {
      base.items = [
        "Metformin 500mg 2x sehari setelah makan",
        "Insulin sesuai skema dokter",
        "Atorvastatin 20mg 1x malam",
        "Aspirin 80mg 1x sehari jika tidak ada kontraindikasi",
      ];
      base.notes = "Rujuk evaluasi lanjutan. Kontrol 3 sampai 5 hari.";
    }
    return base;
  }

  if (specialty === "Stroke") {
    if (stage === "STADIUM_1") {
      base.items = ["Citicoline 500mg 2x sehari", "Vitamin B Kompleks 1x sehari"];
      base.notes = "Fisioterapi ringan. Pantau tekanan darah. Kontrol 1 minggu.";
    }
    if (stage === "STADIUM_2") {
      base.items = ["Citicoline 500mg 2x sehari", "Aspirin 80mg 1x sehari", "Atorvastatin 20mg 1x malam"];
      base.notes = "Pantau gejala neurologis. Kontrol 3 sampai 5 hari.";
    }
    if (stage === "STADIUM_3") {
      base.items = [
        "Obat sesuai penanganan dokter spesialis saraf",
        "Atorvastatin 40mg 1x malam",
        "Antiplatelet sesuai evaluasi dokter",
      ];
      base.notes = "Butuh evaluasi intensif. Pertimbangkan rawat inap atau rujukan.";
    }
    return base;
  }

  if (stage === "STADIUM_1") {
    base.items = ["Paracetamol 500mg 3x sehari bila nyeri", "Vitamin C 1x sehari"];
    base.notes = "Istirahat cukup. Kontrol jika memburuk.";
  }
  if (stage === "STADIUM_2") {
    base.items = ["Paracetamol 500mg 3x sehari", "Omeprazole 20mg 1x pagi bila perut tidak nyaman"];
    base.notes = "Observasi. Kontrol 3 hari.";
  }
  if (stage === "STADIUM_3") {
    base.items = ["Terapi sesuai evaluasi dokter", "Rujuk bila perlu pemeriksaan lanjutan"];
    base.notes = "Butuh pemeriksaan lanjutan. Kontrol 1 sampai 2 hari.";
  }

  return base;
}
