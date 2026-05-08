"use client";

// Lapisan client API.
// Semua request frontend ke backend NestJS dipusatkan di file ini agar endpoint dan header mudah dirawat.
import { clearSession, getToken } from "./auth";
import type {
  ApiItemResponse,
  ApiListResponse,
  AuthMeResponse,
  Booking,
  CreateBookingRequest,
  CreateDoctorReviewRequest,
  CreatePrescriptionRequest,
  DoctorRecord,
  HospitalRecord,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RoomRecord,
  UpdateBookingStatusRequest,
} from "./types";

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

type ApiError = {
  message: string;
  status: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Token diambil dari session client lalu ditempel ke Authorization bila user sudah login.
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await res.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    // Jika token tidak valid, session dibersihkan agar user diminta login ulang.
    if (res.status === 401) clearSession();

    const err: ApiError = {
      message: data?.message || data?.error || "Request gagal",
      status: res.status,
    };
    throw err;
  }

  return data as T;
}

export const api = {
  // Kumpulan helper endpoint yang dipakai halaman frontend.
  login: (body: LoginRequest) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: RegisterRequest) =>
    request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => request<AuthMeResponse>("/auth/me"),

  listHospitals: () => request<ApiListResponse<HospitalRecord>>("/hospitals"),
  listDoctors: () => request<ApiListResponse<DoctorRecord>>("/doctors"),
  listRooms: (params?: { hospitalId?: string; doctorId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.hospitalId) qs.set("hospitalId", params.hospitalId);
    if (params?.doctorId) qs.set("doctorId", params.doctorId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<ApiListResponse<RoomRecord>>(`/rooms${suffix}`);
  },

  createBooking: (body: CreateBookingRequest) =>
    request<ApiItemResponse<Booking>>("/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getMyBookings: () => request<ApiListResponse<Booking>>("/bookings/me"),
  getBookings: () => request<ApiListResponse<Booking>>("/bookings"),
  getBooking: (id: string) => request<ApiItemResponse<Booking>>(`/bookings/${id}`),

  updateBookingStatus: (id: string, body: UpdateBookingStatusRequest) =>
    request<ApiItemResponse<Booking>>(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteBooking: (id: string) =>
    request<{ ok: true }>(`/bookings/${id}`, {
      method: "DELETE",
    }),

  createPrescription: (id: string, body: CreatePrescriptionRequest) =>
    request<ApiItemResponse<Booking>>(`/bookings/${id}/prescription`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  submitDoctorReview: (id: string, body: CreateDoctorReviewRequest) =>
    request<ApiItemResponse<Booking>>(`/bookings/${id}/doctor-review`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
