// Kumpulan schema validasi frontend dengan Zod.
// Schema ini dipakai untuk memvalidasi input user sebelum request dikirim ke backend.
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80, "Nama maksimal 80 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").max(64, "Password maksimal 64 karakter"),
});

export const createBookingSchema = z.object({
  hospitalId: z.string().min(1, "Rumah sakit wajib dipilih"),
  doctorId: z.string().min(1, "Dokter wajib dipilih"),
  roomId: z.string().min(1, "Ruangan wajib dipilih"),
  complaint: z.string().trim().min(5, "Keluhan minimal 5 karakter"),
});

export const createAdminWalkInBookingSchema = createBookingSchema.extend({
  patientName: z.string().trim().min(2, "Nama pasien minimal 2 karakter").max(80, "Nama pasien maksimal 80 karakter"),
  patientAge: z.number().int("Umur pasien harus berupa angka bulat").min(1, "Umur pasien minimal 1 tahun").max(120, "Umur pasien maksimal 120 tahun"),
});

export const createPrescriptionSchema = z.object({
  stage: z.enum(["STADIUM_1", "STADIUM_2", "STADIUM_3"]),
  items: z.array(z.string().trim().min(1, "Obat tidak boleh kosong")).min(1, "Isi minimal 1 obat"),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter"),
});

export const createDoctorReviewSchema = z.object({
  symptoms: z.string().trim().min(5, "Gejala minimal 5 karakter").max(1000, "Gejala maksimal 1000 karakter"),
  diagnosis: z.string().trim().min(3, "Diagnosis minimal 3 karakter").max(255, "Diagnosis maksimal 255 karakter"),
  estimatedCost: z.number().int().min(0, "Estimasi biaya tidak boleh negatif"),
  healthAdvice: z.string().trim().min(3, "Saran kesehatan minimal 3 karakter").max(1000, "Saran maksimal 1000 karakter"),
  stage: z.enum(["STADIUM_1", "STADIUM_2", "STADIUM_3"]),
  items: z.array(z.string().trim().min(1, "Obat tidak boleh kosong")).min(1, "Isi minimal 1 obat"),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type CreateBookingValues = z.infer<typeof createBookingSchema>;
export type CreateAdminWalkInBookingValues = z.infer<typeof createAdminWalkInBookingSchema>;
export type CreatePrescriptionValues = z.infer<typeof createPrescriptionSchema>;
export type CreateDoctorReviewValues = z.infer<typeof createDoctorReviewSchema>;
