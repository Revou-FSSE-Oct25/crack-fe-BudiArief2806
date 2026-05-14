"use client";

// Helper session client.
// File ini hanya menyimpan token, role, dan profil user hasil login dari backend.
import type { Role, User } from "./types";
import { applyPreferences, readUserPreferences } from "./preferences";

const TOKEN_KEY = "crack_token";
const ROLE_KEY = "crack_role";
const USER_KEY = "crack_user";
const TOKEN_COOKIE = "diabstrok_token";
const ROLE_COOKIE = "diabstrok_role";

function isBrowser() {
  return typeof window !== "undefined";
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;

  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(name.length + 1));
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (!isBrowser()) return;

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (!isBrowser()) return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function saveSession(payload: { token: string; role: Role; user: User }) {
  if (!isBrowser()) return;

  // Simpan session minimum yang dibutuhkan frontend untuk navigasi dan proteksi halaman.
  const sessionUser = { ...payload.user, role: payload.role };
  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(ROLE_KEY, payload.role);
  localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
  writeCookie(TOKEN_COOKIE, payload.token, 60 * 60 * 8);
  writeCookie(ROLE_COOKIE, payload.role, 60 * 60 * 8);
  applyPreferences(readUserPreferences(sessionUser));
}

export function clearSession() {
  if (!isBrowser()) return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  clearCookie(TOKEN_COOKIE);
  clearCookie(ROLE_COOKIE);
  applyPreferences(null);
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY) || readCookie(TOKEN_COOKIE);
}

export function getRole(): Role | null {
  if (!isBrowser()) return null;

  const role = localStorage.getItem(ROLE_KEY) || readCookie(ROLE_COOKIE);
  return role === "admin" || role === "doctor" || role === "user" ? role : null;
}

export function getUser(): User | null {
  if (!isBrowser()) return null;

  // User dibaca ulang dari localStorage agar komponen seperti navbar dan role gate bisa menggunakannya.
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as Partial<User>;
    const role = user.role ?? getRole();

    if (!user.id || !user.name || !user.email) return null;
    if (role !== "admin" && role !== "doctor" && role !== "user") return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      doctorId: typeof user.doctorId === "string" ? user.doctorId : undefined,
    };
  } catch {
    return null;
  }
}
