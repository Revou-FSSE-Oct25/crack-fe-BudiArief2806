import { describe, expect, it } from "vitest";

import {
  createAdminWalkInBookingSchema,
  createBookingSchema,
  createDoctorReviewSchema,
  createPrescriptionSchema,
  loginSchema,
  registerSchema,
} from "./schemas";

describe("frontend schemas", () => {
  it("validates login and register payloads", () => {
    expect(loginSchema.safeParse({ email: "admin@example.com", password: "secret123" }).success).toBe(true);
    expect(registerSchema.safeParse({ name: "Admin", email: "admin@example.com", password: "secret123" }).success).toBe(true);
  });

  it("rejects invalid login and register payloads", () => {
    expect(loginSchema.safeParse({ email: "bad-email", password: "123" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "A", email: "bad-email", password: "123" }).success).toBe(false);
  });

  it("validates booking payloads for user and admin walk-in flow", () => {
    expect(
      createBookingSchema.safeParse({
        hospitalId: "thb",
        doctorId: "d2",
        roomId: "r1",
        complaint: "Kontrol rutin diabetes",
      }).success,
    ).toBe(true);

    expect(
      createAdminWalkInBookingSchema.safeParse({
        hospitalId: "thb",
        doctorId: "d2",
        roomId: "r1",
        complaint: "Pasien datang langsung ke rumah sakit",
        patientName: "Budi Santoso",
        patientAge: 54,
      }).success,
    ).toBe(true);
  });

  it("rejects incomplete booking payloads", () => {
    expect(
      createBookingSchema.safeParse({
        hospitalId: "",
        doctorId: "",
        roomId: "",
        complaint: "abc",
      }).success,
    ).toBe(false);

    expect(
      createAdminWalkInBookingSchema.safeParse({
        hospitalId: "thb",
        doctorId: "d2",
        roomId: "r1",
        complaint: "Pasien",
        patientName: "A",
        patientAge: 0,
      }).success,
    ).toBe(false);
  });

  it("validates prescription and doctor review payloads", () => {
    expect(
      createPrescriptionSchema.safeParse({
        stage: "STADIUM_1",
        items: ["Metformin 500mg"],
        notes: "Kontrol 2 minggu",
      }).success,
    ).toBe(true);

    expect(
      createDoctorReviewSchema.safeParse({
        symptoms: "Sering haus dan cepat lelah",
        diagnosis: "Diabetes tipe 2",
        estimatedCost: 350000,
        healthAdvice: "Kurangi gula dan kontrol rutin",
        stage: "STADIUM_2",
        items: ["Metformin 500mg"],
        notes: "Pantau gula darah",
      }).success,
    ).toBe(true);

    expect(
      createDoctorReviewSchema.safeParse({
        symptoms: "abc",
        diagnosis: "",
        estimatedCost: -1,
        healthAdvice: "",
        stage: "STADIUM_2",
        items: [],
        notes: "x".repeat(600),
      }).success,
    ).toBe(false);
  });
});
