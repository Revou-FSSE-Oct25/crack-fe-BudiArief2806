import type { Metadata } from "next";
import { ToastProvider } from "@/app/components/Toast";
import "./globals.css";

// Layout utama aplikasi.
// File ini membungkus semua halaman agar style global dan metadata berlaku di seluruh app.
export const metadata: Metadata = {
  title: "Diabstrok Project",
  description: "Frontend and backend healthcare dashboard for hospital program management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <script
          // Terapkan preferensi akun login sebelum React hydrate agar tema global tidak berkedip.
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var rawUser = localStorage.getItem("crack_user");
                var user = rawUser ? JSON.parse(rawUser) : null;
                var rawPreferences = user && user.id && user.role ? localStorage.getItem("diabstrok_preferences_" + user.role + "_" + user.id) : null;
                var preferences = rawPreferences ? JSON.parse(rawPreferences) : null;
                if (!preferences && user && user.id && user.role === "admin") {
                  preferences = {
                    name: localStorage.getItem("diabstrok_admin_name") || user.name,
                    email: localStorage.getItem("diabstrok_admin_email") || user.email,
                    phone: localStorage.getItem("diabstrok_admin_phone") || "",
                    darkMode: localStorage.getItem("diabstrok_admin_dark_mode") === "true",
                    language: localStorage.getItem("diabstrok_admin_language") === "en" ? "en" : "id"
                  };
                  localStorage.setItem("diabstrok_preferences_" + user.role + "_" + user.id, JSON.stringify(preferences));
                }
                document.documentElement.dataset.theme = preferences && preferences.darkMode === true ? "dark" : "light";
                document.documentElement.lang = preferences && preferences.language === "en" ? "en" : "id";
              } catch (error) {}
            `,
          }}
        />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
