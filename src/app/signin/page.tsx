"use client";

// Halaman login.
// Setelah backend mengembalikan token dan user, session disimpan di browser agar halaman lain bisa membaca role user.
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/app/components/Navbar";
import { useToast } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/Button";
import { InputField } from "@/app/components/ui/InputField";
import { SurfaceCard } from "@/app/components/ui/SurfaceCard";
import { saveSession } from "@/app/lib/auth";
import { api } from "@/app/lib/api";
import { loginSchema, type LoginValues } from "@/app/lib/schemas";

export default function SignInPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setLoading(true);
    setErr(null);

    try {
      // Request login utama menuju backend NestJS.
      const res = await api.login(values);
      saveSession({ token: res.accessToken, role: res.role, user: res.user });
      showToast({
        tone: "success",
        title: "Login berhasil",
        description: "Session disimpan dan halaman terlindungi sudah aktif.",
      });

      // Jika user datang dari halaman tertentu, arahkan kembali ke sana setelah login sukses.
      const callbackUrl =
        typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("callbackUrl") || "";
      const nextUrl =
        callbackUrl || (res.role === "admin" ? "/admin" : res.role === "doctor" ? "/doctor" : "/dashboard");
      router.push(nextUrl);
    } catch (error: any) {
      const message = error?.message || "Login gagal";
      setErr(message);
      showToast({ tone: "error", title: "Login gagal", description: message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!googleClientId || !googleScriptReady || !googleButtonRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async ({ credential }) => {
        if (!credential) {
          setErr("Google login gagal: token tidak diterima.");
          return;
        }

        setGoogleLoading(true);
        setErr(null);

        try {
          const res = await api.googleLogin(credential);
          saveSession({ token: res.accessToken, role: res.role, user: res.user });
          showToast({
            tone: "success",
            title: "Login Google berhasil",
            description: "Session disimpan dan Anda langsung masuk ke dashboard.",
          });

          const callbackUrl =
            typeof window === "undefined"
              ? ""
              : new URLSearchParams(window.location.search).get("callbackUrl") || "";
          const nextUrl =
            callbackUrl || (res.role === "admin" ? "/admin" : res.role === "doctor" ? "/doctor" : "/dashboard");
          router.push(nextUrl);
        } catch (error: any) {
          const message = error?.message || "Google login gagal";
          setErr(message);
          showToast({ tone: "error", title: "Google login gagal", description: message });
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: "signin_with",
      width: "420",
    });
  }, [googleClientId, googleScriptReady, router, showToast]);

  const { register, handleSubmit, formState } = form;

  return (
    <div className="page-shell min-h-screen">
      {googleClientId ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGoogleScriptReady(true)}
        />
      ) : null}
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <SurfaceCard className="mesh-panel flex flex-col justify-between">
            <div>
              <div className="section-label">
                <span className="section-dot" />
                Login Page
              </div>
              <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Masuk ke sistem booking Diabstrok.
              </h1>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.35rem] border border-[var(--color-border)] bg-white p-4">
                
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="mx-auto w-full max-w-xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">Sign In</div>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Autentikasi user</h2>
            <p className="mt-2 text-sm text-[var(--color-foreground-soft)]">
              Gunakan akun yang sudah terdaftar.
            </p>

            {googleClientId ? (
              <div className="mt-6">
                <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  Login Dengan Google
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="rounded-[1.4rem] border border-slate-200 bg-white p-3 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)]">
                  <div className="flex justify-center">
                    <div ref={googleButtonRef} />
                  </div>
                </div>
                {googleLoading ? (
                  <p className="mt-3 text-center text-sm font-medium text-[var(--color-primary)]">
                    Memproses login Google...
                  </p>
                ) : null}
              </div>
            ) : null}

            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <InputField
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                error={formState.errors.email?.message}
                {...register("email")}
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Minimal 6 karakter"
                autoComplete="current-password"
                error={formState.errors.password?.message}
                {...register("password")}
              />

              {err ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {err}
                </div>
              ) : null}

              <Button type="submit" size="lg" fullWidth disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-sm text-[var(--color-foreground-muted)]">
                Belum punya akun?{" "}
                <Link href="/signup" className="font-semibold text-[var(--color-accent)]">
                  Sign Up
                </Link>
              </p>
            </form>
          </SurfaceCard>
        </div>
      </main>
    </div>
  );
}
