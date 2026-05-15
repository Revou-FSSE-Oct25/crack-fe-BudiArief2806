"use client";

import { useEffect, useState } from "react";
import {
  applyPreferences,
  PREFERENCES_CHANGED_EVENT,
  readSessionUserPreferences,
  type UserPreferences,
} from "./preferences";

export function useSessionPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    function syncPreferences() {
      // Preferensi dibaca ulang dari session browser agar semua komponen bereaksi saat setting berubah.
      const currentPreferences = readSessionUserPreferences();
      applyPreferences(currentPreferences);
      setPreferences(currentPreferences);
    }

    syncPreferences();

    function handleStorage(event: StorageEvent) {
      if (!event.key || event.key.startsWith("crack_") || event.key.startsWith("diabstrok_preferences_")) {
        syncPreferences();
      }
    }

    function handlePreferencesChanged() {
      syncPreferences();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PREFERENCES_CHANGED_EVENT, handlePreferencesChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PREFERENCES_CHANGED_EVENT, handlePreferencesChanged);
    };
  }, []);

  return {
    preferences,
    language: preferences?.language || "id",
    darkMode: preferences?.darkMode === true,
  };
}
