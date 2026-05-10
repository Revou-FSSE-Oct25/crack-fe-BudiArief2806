"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearSession, getRole, getUser } from "@/app/lib/auth";

type NavItem = {
  href: string;
  label: string;
  active: boolean;
  anchor?: boolean;
};

function AppIcon() {
  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-lg shadow-violet-500/20 ring-1 ring-slate-200/70">
      <Image
        src="/logo2.png"
        alt="Lambang DIABSTROK"
        fill
        sizes="48px"
        className="object-cover"
      />
    </div>
  );
}

function navLinkClass(active: boolean) {
  return [
    "relative pb-4 text-sm font-medium transition",
    active ? "text-violet-600" : "text-slate-600 hover:text-slate-900",
    "after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-10 after:-translate-x-1/2 after:rounded-full after:transition",
    active ? "after:bg-violet-600" : "after:bg-transparent",
  ].join(" ");
}

export function Navbar() {
  const path = usePathname();
  const router = useRouter();

  const [role, setRole] = useState<"admin" | "doctor" | "user" | null>(null);
  const [name, setName] = useState("");
  const [activeSection, setActiveSection] = useState("top");

  useEffect(() => {
    const currentRole = getRole();
    const currentUser = getUser();
    const maybeName =
      currentUser && typeof (currentUser as { name?: unknown }).name === "string"
        ? ((currentUser as { name?: string }).name ?? "")
        : "";

    setRole(currentRole);
    setName(maybeName);
  }, [path]);

  useEffect(() => {
    if (path !== "/" || role === "admin") {
      setActiveSection("top");
      return;
    }

    const sectionIds = ["top", "dashboard-preview", "login-access", "doctor-availability", "hospital-availability"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-35% 0px -45% 0px" },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [path, role]);

  const authed = !!role;
  const dashboardHref =
    role === "doctor" ? "/doctor" : role === "admin" ? "/admin" : "/dashboard";

  const navItems: NavItem[] =
    role === "admin"
      ? [
          { href: "/admin", label: "Dashboard", active: path.startsWith("/admin") },
          {
            href: "/hospitals",
            label: "Daftar Rumah Sakit",
            active: path.startsWith("/hospitals"),
          },
          {
            href: "/doctors",
            label: "Daftar Dokter",
            active: path.startsWith("/doctors"),
          },
        ]
      : path === "/"
      ? [
          { href: "#top", label: "Home", active: activeSection === "top", anchor: true },
          {
            href: "#dashboard-preview",
            label: "Dashboard",
            active: activeSection === "dashboard-preview",
            anchor: true,
          },
          {
            href: "#doctor-availability",
            label: "Daftar Dokter",
            active: activeSection === "doctor-availability",
            anchor: true,
          },
          {
            href: "#hospital-availability",
            label: "Daftar Rumah Sakit",
            active: activeSection === "hospital-availability",
            anchor: true,
          },
        ]
      : [
          { href: "/", label: "Home", active: path === "/" },
          {
            href: dashboardHref,
            label: "Dashboard",
            active:
              path.startsWith("/dashboard") ||
              path.startsWith("/admin") ||
              path.startsWith("/doctor"),
          },
          {
            href: "/hospitals",
            label: "Daftar Rumah Sakit",
            active: path.startsWith("/hospitals"),
          },
          {
            href: "/doctors",
            label: "Daftar Dokter",
            active: path.startsWith("/doctors"),
          },
        ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[84px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <AppIcon />
          <span className="text-lg font-black tracking-tight text-transparent bg-gradient-to-r from-teal-700 via-cyan-600 to-violet-600 bg-clip-text sm:text-xl">
            DIABSTROK
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.anchor ? `/${item.href}` : item.href}
              className={navLinkClass(item.active)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!authed ? (
            <>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Masuk
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(79,70,229,0.7)] transition hover:translate-y-[-1px]"
              >
                Daftar
              </Link>
            </>
          ) : (
            <>
              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right sm:block">
                <p className="text-xs text-slate-500">Masuk sebagai</p>
                <p className="text-sm font-semibold text-slate-900">
                  {name || "Pengguna"}
                </p>
              </div>
              <button
                onClick={() => {
                  clearSession();
                  router.push("/signin");
                }}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
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
