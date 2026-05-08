"use client";

// Navbar global aplikasi.
// Komponen ini membaca session client untuk menentukan menu user/admin dan aksi logout.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearSession, getRole, getUser } from "@/app/lib/auth";

export function Navbar() {
  const path = usePathname();
  const router = useRouter();

  const [role, setRole] = useState<"admin" | "doctor" | "user" | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    // Setiap kali route berubah, baca ulang session agar navbar selalu menampilkan state terbaru.
    const r = getRole();
    const u = getUser();

    setRole(r);

    // aman kalau tipe User kamu masih berubah-ubah
    const maybeName =
      u && typeof (u as any).name === "string" ? (u as any).name : "";
    setName(maybeName);
  }, [path]);

  const authed = !!role;
  const dashboardHref = role === "doctor" ? "/doctor" : role === "admin" ? "/admin" : "/dashboard";

  function navLinkClass(active: boolean) {
    return active
      ? "text-sm font-medium text-slate-900"
      : "text-sm font-medium text-slate-500 hover:text-slate-900";
  }

  const navItems =
    role === "admin"
      ? [
          { href: "/hospitals", label: "Daftar Rumah Sakit", active: path.startsWith("/hospitals") },
          { href: "/doctors", label: "Daftar Dokter", active: path.startsWith("/doctors") },
          { href: "/admin", label: "Admin", active: path.startsWith("/admin") },
        ]
      : [
          { href: "/", label: "Home", active: path === "/" },
          {
            href: dashboardHref,
            label: "Dashboard",
            active: path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/doctor"),
          },
          { href: "/hospitals", label: "Daftar Rumah Sakit", active: path.startsWith("/hospitals") },
          { href: "/doctors", label: "Daftar Dokter", active: path.startsWith("/doctors") },
          ...(role === "doctor"
            ? [{ href: "/doctor", label: "Dokter", active: path.startsWith("/doctor") }]
            : []),
        ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <span className="text-sm font-semibold">DS</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            DIABSTROK
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} className={navLinkClass(item.active)} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!authed ? (
            <>
              <Link
                href="/signup"
                className="hidden items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
              >
                Sign Up
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
              <span className="hidden text-sm text-slate-600 sm:block">
                Hi, {name || "User"}
              </span>
              <button
                onClick={() => {
                  clearSession();
                  router.push("/signin");
                }}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
