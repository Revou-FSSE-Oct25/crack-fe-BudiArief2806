"use client";

import { useEffect, useState } from "react";
import { applyPreferences, readSessionUserPreferences, type UserPreferences } from "./preferences";

export function useSessionPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    // Preferensi hanya dibaca kalau ada akun login di session browser.
    const currentPreferences = readSessionUserPreferences();
    applyPreferences(currentPreferences);
    setPreferences(currentPreferences);
  }, []);

  return {
    preferences,
    language: preferences?.language || "id",
    darkMode:
      preferences?.darkMode === true ||
      (typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"),
  };
}
