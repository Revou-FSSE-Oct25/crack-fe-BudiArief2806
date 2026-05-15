"use client";

// Dashboard user.
// Halaman ini menarik ringkasan booking milik user dari backend dan menampilkan statistik cepat.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HealthAssistantPanel } from "@/app/components/HealthAssistantPanel";
import { Navbar } from "@/app/components/Navbar";
import { RoleGate } from "@/app/components/RoleGate";
import { getUser, updateSessionUser } from "@/app/lib/auth";
import { api } from "@/app/lib/api";
import { applyPreferences, readUserPreferences, saveUserPreferences } from "@/app/lib/preferences";
import { useSessionPreferences } from "@/app/lib/use-preferences";
import type { Booking, User } from "@/app/lib/types";

const dashboardCopy = {
  id: {
    title: "Dashboard",
    subtitle: "Ringkasan booking sekarang diambil langsung dari backend NestJS, bukan dari storage lokal browser.",
    loadError: "Gagal memuat dashboard",
    totalBooking: "Total Booking",
    pending: "Pending",
    inProgress: "Diproses",
    completed: "Completed",
    activity: "Aktivitas Booking",
    activityDesc: "Lihat status terbaru dari booking yang sudah kamu buat.",
    openBookings: "Buka My Bookings",
    queue: "Antrian",
    minutes: "menit",
    empty: "Belum ada booking. Mulai dari halaman rumah sakit.",
    quickActions: "Aksi Cepat",
    createBooking: "Buat booking baru",
    history: "Lihat riwayat booking",
    note: "Swagger dan Postman nanti akan memakai endpoint backend yang sama dengan halaman ini.",
    profileTitle: "Profil Saya",
    profileDesc: "User juga bisa mengubah nama tampilan, email, nomor HP, tema, dan bahasa langsung dari dashboard.",
    profileName: "Nama Profil",
    profileNamePlaceholder: "Nama user",
    phone: "Nomor HP",
    darkMode: "Mode Gelap",
    language: "Bahasa",
    darkModeOn: "Mode gelap aktif",
    lightModeOn: "Mode terang aktif",
    saveSettings: "Simpan Profil",
    settingsSaved: "Profil user berhasil disimpan.",
    assistantTitle: "Assistant edukasi hanya tersedia untuk akun user.",
  },
  en: {
    title: "Dashboard",
    subtitle: "Booking summary is now loaded directly from the NestJS backend, not from local browser storage.",
    loadError: "Failed to load dashboard",
    totalBooking: "Total Bookings",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    activity: "Booking Activity",
    activityDesc: "See the latest status from bookings you have created.",
    openBookings: "Open My Bookings",
    queue: "Queue",
    minutes: "minutes",
    empty: "No bookings yet. Start from the hospital page.",
    quickActions: "Quick Actions",
    createBooking: "Create new booking",
    history: "View booking history",
    note: "Swagger and Postman will use the same backend endpoints as this page.",
    profileTitle: "My Profile",
    profileDesc: "Users can also update display name, email, phone number, theme, and language directly from the dashboard.",
    profileName: "Profile Name",
    profileNamePlaceholder: "User name",
    phone: "Phone Number",
    darkMode: "Dark Mode",
    language: "Language",
    darkModeOn: "Dark mode active",
    lightModeOn: "Light mode active",
    saveSettings: "Save Profile",
    settingsSaved: "User profile saved successfully.",
    assistantTitle: "Educational assistant is available for user accounts only.",
  },
};

export default function DashboardPage() {
  const { language, darkMode } = useSessionPreferences();
  const copy = dashboardCopy[language];
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<User | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileDarkMode, setProfileDarkMode] = useState(false);
  const [profileLanguage, setProfileLanguage] = useState<"id" | "en">("id");
  const [settingsSaved, setSettingsSaved] = useState("");

  useEffect(() => {
    const currentUser = getUser();
    setViewer(currentUser);

    if (!currentUser) return;

    const preferences = readUserPreferences(currentUser);
    setProfileName(preferences?.name || currentUser.name);
    setProfileEmail(preferences?.email || currentUser.email);
    setProfilePhone(preferences?.phone || "");
    setProfileDarkMode(preferences?.darkMode || false);
    setProfileLanguage(preferences?.language || "id");
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Load data dashboard dari endpoint booking user yang sedang login.
      setLoading(true);
      setError(null);

      try {
        const res = await api.getMyBookings();
        if (!mounted) return;
        setItems(res.items);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || copy.loadError);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [copy.loadError]);

  const stats = useMemo(() => {
    const pending = items.filter((item) => item.status === "PENDING").length;
    const inReview = items.filter(
      (item) => item.status === "CONFIRMED" || item.status === "REVIEWED_BY_DOCTOR"
    ).length;
    const completed = items.filter((item) => item.status === "COMPLETED").length;

    return {
      total: items.length,
      pending,
      inReview,
      completed,
    };
  }, [items]);

  function saveProfileSettings() {
    if (!viewer) return;

    saveUserPreferences(viewer, {
      name: profileName.trim() || viewer.name,
      email: profileEmail.trim() || viewer.email,
      phone: profilePhone.trim(),
      darkMode: profileDarkMode,
      language: profileLanguage,
    });

    applyPreferences({ darkMode: profileDarkMode, language: profileLanguage });
    const nextUser = updateSessionUser({
      name: profileName.trim() || viewer.name,
      email: profileEmail.trim() || viewer.email,
    });
    setViewer(nextUser);
    setSettingsSaved(copy.settingsSaved);
  }

  return (
    <div className={darkMode ? "min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-slate-50"}>
      <Navbar />
      <RoleGate allow={["admin", "user"]}>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {copy.subtitle}
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: copy.totalBooking, value: stats.total },
              { label: copy.pending, value: stats.pending },
              { label: copy.inProgress, value: stats.inReview },
              { label: copy.completed, value: stats.completed },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-medium text-slate-500">{card.label}</div>
                <div className="mt-2 text-3xl font-black text-slate-950">
                  {loading ? <span className="text-lg font-semibold text-slate-400">...</span> : card.value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{copy.activity}</h2>
                  <p className="mt-1 text-sm text-slate-600">{copy.activityDesc}</p>
                </div>
                <Link
                  href="/my-bookings"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {copy.openBookings}
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {items.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-bold text-slate-900">{item.hospitalName}</div>
                      <div className="text-xs font-semibold text-slate-500">{item.status}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {item.doctorName} · {item.roomName}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {copy.queue} {item.queueNumber} - ETA {item.etaMinutes} {copy.minutes}
                    </div>
                  </div>
                ))}

                {!loading && items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    {copy.empty}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">{copy.quickActions}</h2>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/hospitals"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  {copy.createBooking}
                </Link>
                <Link
                  href="/my-bookings"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  {copy.history}
                </Link>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
                  {copy.note}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">{copy.profileTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{copy.profileDesc}</p>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{copy.profileName}</span>
                  <input
                    value={profileName}
                    onChange={(event) => {
                      setProfileName(event.target.value);
                      setSettingsSaved("");
                    }}
                    placeholder={copy.profileNamePlaceholder}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Email</span>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(event) => {
                      setProfileEmail(event.target.value);
                      setSettingsSaved("");
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{copy.phone}</span>
                  <input
                    value={profilePhone}
                    onChange={(event) => {
                      setProfilePhone(event.target.value);
                      setSettingsSaved("");
                    }}
                    placeholder="+62..."
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">{copy.darkMode}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDarkMode((current) => !current);
                      setSettingsSaved("");
                    }}
                    className="mt-3 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                  >
                    <span>{profileDarkMode ? copy.darkModeOn : copy.lightModeOn}</span>
                    <span className={profileDarkMode ? "flex h-6 w-11 items-center rounded-full bg-indigo-500 p-1" : "flex h-6 w-11 items-center rounded-full bg-slate-200 p-1"}>
                      <span className={profileDarkMode ? "h-4 w-4 translate-x-5 rounded-full bg-white transition" : "h-4 w-4 translate-x-0 rounded-full bg-white transition"} />
                    </span>
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">{copy.language}</div>
                  <div className="mt-3 inline-flex rounded-full bg-white p-1 ring-1 ring-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileLanguage("id");
                        setSettingsSaved("");
                      }}
                      className={profileLanguage === "id" ? "rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" : "rounded-full px-4 py-2 text-sm font-semibold text-slate-500"}
                    >
                      Indonesia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileLanguage("en");
                        setSettingsSaved("");
                      }}
                      className={profileLanguage === "en" ? "rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" : "rounded-full px-4 py-2 text-sm font-semibold text-slate-500"}
                    >
                      English
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveProfileSettings}
                  className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  {copy.saveSettings}
                </button>

                {settingsSaved ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {settingsSaved}
                  </div>
                ) : null}
              </div>
            </div>

            {viewer?.role === "user" ? <HealthAssistantPanel language={language} /> : null}
          </div>
        </main>
      </RoleGate>
    </div>
  );
}
