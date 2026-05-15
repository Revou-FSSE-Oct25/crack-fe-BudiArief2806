"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { SurfaceCard } from "@/app/components/ui/SurfaceCard";
import { api } from "@/app/lib/api";

type VerificationState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("Memverifikasi email Anda...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setMessage("Token verifikasi tidak ditemukan. Silakan daftar ulang atau minta link verifikasi baru.");
      return;
    }

    let mounted = true;

    api
      .verifyEmailToken(token)
      .then(() => {
        if (!mounted) return;
        setState("success");
        setMessage("Email berhasil diverifikasi. Anda sekarang bisa login ke sistem Diabstrok.");
      })
      .catch((error: any) => {
        if (!mounted) return;
        setState("error");
        setMessage(error?.message || "Verifikasi email gagal. Coba lagi dengan link yang masih aktif.");
      });

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <SurfaceCard className="mx-auto w-full max-w-2xl text-center">
        <div className="section-label mx-auto">
          <span className="section-dot" />
          Email Verification
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
          {state === "loading"
            ? "Memeriksa token verifikasi"
            : state === "success"
              ? "Email berhasil diverifikasi"
              : "Verifikasi email tidak berhasil"}
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-foreground-muted)]">{message}</p>

        <div
          className={`mt-8 rounded-[1.6rem] border px-5 py-4 text-sm font-semibold ${
            state === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : state === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-[var(--color-border)] bg-white text-slate-700"
          }`}
        >
          {state === "loading"
            ? "Mohon tunggu, sistem sedang memvalidasi token dari backend."
            : state === "success"
              ? "Status akun Anda sudah aktif dan siap digunakan."
              : "Pastikan Anda membuka link verifikasi terbaru yang diberikan setelah registrasi."}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signin"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-[0_20px_45px_-24px_rgba(14,116,144,0.8)] transition duration-200 hover:bg-[var(--color-primary-strong)]"
          >
            Masuk ke Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white px-6 text-sm font-semibold text-[var(--color-foreground)] transition duration-200 hover:bg-[var(--color-surface-alt)]"
          >
            Daftar ulang
          </Link>
        </div>
      </SurfaceCard>
    </main>
  );
}

function VerifyEmailFallback() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <SurfaceCard className="mx-auto w-full max-w-2xl text-center">
        <div className="section-label mx-auto">
          <span className="section-dot" />
          Email Verification
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">Memuat halaman verifikasi</h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-foreground-muted)]">
          Kami sedang menyiapkan token verifikasi dari URL Anda.
        </p>
      </SurfaceCard>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="page-shell min-h-screen">
      <Navbar />
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
