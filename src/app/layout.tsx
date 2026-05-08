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
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
