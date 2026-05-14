"use client";

import type { Booking, RoomType, Specialty } from "@/app/lib/types";

export type PaymentSimulationStatus = "pending" | "proof_uploaded" | "verified";

export type PaymentSimulationRecord = {
  bookingId: string;
  amount: number;
  status: PaymentSimulationStatus;
  hospitalName: string;
  doctorName: string;
  roomName: string;
  createdAt: string;
  proofImage?: string;
  proofUploadedAt?: string;
  verifiedAt?: string;
};

const STORAGE_KEY = "diabstrok_payment_simulation_v1";

function baseAmountByRoom(roomType: RoomType) {
  if (roomType === "VIP") return 350000;
  if (roomType === "Kelas 1") return 250000;
  if (roomType === "Kelas 2") return 185000;
  return 500000;
}

function specialtySurcharge(specialty: Specialty) {
  if (specialty === "Diabetes") return 90000;
  if (specialty === "Stroke") return 125000;
  return 50000;
}

export function estimateSimulationAmount(input: Pick<Booking, "roomType" | "specialty">) {
  // Nominal simulasi dibuat konsisten agar demo QR terasa realistis.
  return baseAmountByRoom(input.roomType) + specialtySurcharge(input.specialty);
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readPaymentSimulationMap() {
  if (!canUseStorage()) return {} as Record<string, PaymentSimulationRecord>;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, PaymentSimulationRecord>;
    return parsed || {};
  } catch {
    return {};
  }
}

function writePaymentSimulationMap(map: Record<string, PaymentSimulationRecord>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getPaymentSimulation(bookingId: string) {
  return readPaymentSimulationMap()[bookingId] || null;
}

export function savePendingPaymentSimulation(booking: Booking) {
  const map = readPaymentSimulationMap();
  const current = map[booking.id];

  map[booking.id] = {
    bookingId: booking.id,
    amount: current?.amount || estimateSimulationAmount(booking),
    status: current?.status || "pending",
    hospitalName: booking.hospitalName,
    doctorName: booking.doctorName,
    roomName: booking.roomName,
    createdAt: current?.createdAt || new Date().toISOString(),
    proofImage: current?.proofImage,
    proofUploadedAt: current?.proofUploadedAt,
    verifiedAt: current?.verifiedAt,
  };

  writePaymentSimulationMap(map);
  return map[booking.id];
}

export function confirmPaymentSimulation(bookingId: string) {
  const map = readPaymentSimulationMap();
  const current = map[bookingId];
  if (!current) return null;

  map[bookingId] = {
    ...current,
    status: "verified",
    verifiedAt: new Date().toISOString(),
  };

  writePaymentSimulationMap(map);
  return map[bookingId];
}

export function uploadPaymentSimulationProof(bookingId: string, proofImage: string) {
  const map = readPaymentSimulationMap();
  const current = map[bookingId];
  if (!current) return null;

  map[bookingId] = {
    ...current,
    status: "proof_uploaded",
    proofImage,
    proofUploadedAt: new Date().toISOString(),
  };

  writePaymentSimulationMap(map);
  return map[bookingId];
}
