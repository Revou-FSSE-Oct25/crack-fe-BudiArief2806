"use client";

// Halaman register.
// User mengisi form, lalu frontend mengirim data ke backend NestJS melalui api.register().
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/app/components/Navbar";
import { useToast } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/Button";
import { InputField } from "@/app/components/ui/InputField";
import { SurfaceCard } from "@/app/components/ui/SurfaceCard";
import { api } from "@/app/lib/api";
import { registerSchema, type RegisterValues } from "@/app/lib/schemas";

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [verificationHint, setVerificationHint] = useState("");

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const { register, handleSubmit, formState } = form;

  async function onSubmit(values: RegisterValues) {
    // Reset state UI sebelum request baru dikirim.
    setErr("");
    setDone(false);
    setVerificationHint("");
    setLoading(true);

    try {
      // Register selalu dikirim ke backend, bukan disimpan ke localStorage.
      const result = await api.register(values);
      setDone(true);
      const verificationUrl = result.verificationUrl;
      const nextPath =
        verificationUrl && typeof window !== "undefined"
          ? verificationUrl.replace(window.location.origin, "")
          : "/verify-email";
      setVerificationHint("Akun berhasil dibuat. Silakan verifikasi email sebelum login.");
      showToast({
        tone: "success",
        title: "Akun berhasil dibuat",
        description: "Silakan verifikasi email lebih dulu sebelum login.",
      });
      setTimeout(() => {
        if (verificationUrl && typeof window !== "undefined") {
          window.location.assign(verificationUrl);
          return;
        }

        router.push(nextPath);
      }, 800);
    } catch (error: any) {
      const message = error?.message || "Register gagal";
      setErr(message);
      showToast({ tone: "error", title: "Register gagal", description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SurfaceCard className="mesh-panel">
            <div className="section-label">
              <span className="section-dot" />
              Register Page
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">Buat akun dari backend resmi.</h1>
            <p className="mt-4 text-sm leading-7 text-[var(--color-foreground-muted)]">
              Halaman ini langsung mengirim data ke `POST /auth/register` pada backend NestJS. Frontend tidak lagi
              menyimpan database akun sendiri.
            </p>

            <div className="mt-6 grid gap-3">
              {["Nama lengkap", "Email aktif", "Password minimal 6 karakter"].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                >
                  {item}
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="mx-auto w-full max-w-xl">
            <h2 className="text-3xl font-black text-slate-950">Daftar Akun</h2>
            <p className="mt-2 text-sm text-[var(--color-foreground-soft)]">
              Setelah berhasil daftar, lanjut login untuk masuk ke dashboard.
            </p>

            {err ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {err}
              </div>
            ) : null}

            {done ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {verificationHint || "Akun berhasil dibuat. Mengarahkan ke halaman verifikasi email."}
              </div>
            ) : null}

            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <InputField
                label="Nama"
                placeholder="Nama lengkap"
                autoComplete="name"
                error={formState.errors.name?.message}
                {...register("name")}
              />

              <InputField
                label="Email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                error={formState.errors.email?.message}
                {...register("email")}
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                error={formState.errors.password?.message}
                {...register("password")}
              />

              <Button type="submit" size="lg" fullWidth disabled={loading}>
                {loading ? "Mendaftar..." : "Daftar"}
              </Button>

              <p className="text-sm text-slate-600">
                Sudah punya akun?{" "}
                <Link href="/signin" className="font-medium text-[var(--color-accent)]">
                  Sign In
                </Link>
              </p>
            </form>
          </SurfaceCard>
        </div>
      </main>
    </div>
  );
}
