"use client";

// Preferensi tampilan disimpan per akun login, bukan global untuk semua user di browser.
import type { User } from "./types";

export type AppLanguage = "id" | "en";

export type UserPreferences = {
  name: string;
  email: string;
  phone: string;
  darkMode: boolean;
  language: AppLanguage;
};

const PREFERENCE_PREFIX = "diabstrok_preferences";

function isBrowser() {
  return typeof window !== "undefined";
}

export function preferenceKey(user: Pick<User, "id" | "role">) {
  return `${PREFERENCE_PREFIX}_${user.role}_${user.id}`;
}

export function defaultPreferences(user: User): UserPreferences {
  return {
    name: user.name,
    email: user.email,
    phone: "",
    darkMode: false,
    language: "id",
  };
}

export function readUserPreferences(user: User | null): UserPreferences | null {
  if (!isBrowser() || !user) return null;

  const defaults = defaultPreferences(user);
  const raw = localStorage.getItem(preferenceKey(user));
  if (!raw) {
    // Migrasi setting lama hanya untuk admin agar user/dokter tidak ikut memakai tema admin.
    const legacyDarkMode = localStorage.getItem("diabstrok_admin_dark_mode");
    const legacyLanguage = localStorage.getItem("diabstrok_admin_language");
    const legacyPreferences: UserPreferences | null =
      user.role === "admin" && (legacyDarkMode || legacyLanguage)
        ? {
            ...defaults,
            name: localStorage.getItem("diabstrok_admin_name") || defaults.name,
            email: localStorage.getItem("diabstrok_admin_email") || defaults.email,
            phone: localStorage.getItem("diabstrok_admin_phone") || defaults.phone,
            darkMode: legacyDarkMode === "true",
            language: legacyLanguage === "en" ? "en" : "id",
          }
        : null;

    if (legacyPreferences) {
      localStorage.setItem(preferenceKey(user), JSON.stringify(legacyPreferences));
      return legacyPreferences;
    }

    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : defaults.name,
      email: typeof parsed.email === "string" && parsed.email.trim() ? parsed.email : defaults.email,
      phone: typeof parsed.phone === "string" ? parsed.phone : defaults.phone,
      darkMode: parsed.darkMode === true,
      language: parsed.language === "en" ? "en" : "id",
    };
  } catch {
    return defaults;
  }
}

export function saveUserPreferences(user: User, preferences: UserPreferences) {
  if (!isBrowser()) return;
  localStorage.setItem(preferenceKey(user), JSON.stringify(preferences));
}

export function applyPreferences(preferences: Pick<UserPreferences, "darkMode" | "language"> | null) {
  if (!isBrowser()) return;

  document.documentElement.dataset.theme = preferences?.darkMode ? "dark" : "light";
  document.documentElement.lang = preferences?.language || "id";
}

export function readSessionUserPreferences(): UserPreferences | null {
  if (!isBrowser()) return null;

  const rawUser = localStorage.getItem("crack_user");
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as User;
    if (!user?.id || !user?.name || !user?.email) return null;
    return readUserPreferences(user);
  } catch {
    return null;
  }
}
