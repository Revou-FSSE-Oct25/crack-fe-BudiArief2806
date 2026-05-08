"use client";

// Guard sederhana di sisi frontend.
// Komponen ini membaca role dari session client lalu mengarahkan user bila akses tidak sesuai.
import { getRole } from "@/app/lib/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/app/lib/types";

export function RoleGate(props: { allow: Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Cek role saat komponen dibuka sebelum menampilkan halaman terlindungi.
    const role = getRole();
    if (!role) {
      router.replace("/signin");
      return;
    }
    if (!props.allow.includes(role)) {
      router.replace(role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/dashboard");
      return;
    }
    setReady(true);
  }, [router, props.allow]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{props.children}</>;
}
