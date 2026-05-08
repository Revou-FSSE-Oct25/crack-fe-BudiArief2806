import { Navbar } from "@/app/components/Navbar";
import Link from "next/link";

// Homepage statis untuk mengenalkan produk, memberi navigasi awal, dan mengarahkan user ke login/dashboard.
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[100%] rounded-full bg-gradient-to-br from-indigo-100/50 to-teal-100/30 blur-3xl opacity-70" />
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[80%] rounded-full bg-gradient-to-bl from-blue-100/40 to-purple-100/40 blur-3xl opacity-60" />
      </div>

      <Navbar />

      <main className="flex-1">
        <section className="relative pt-20 pb-14 sm:pt-28 sm:pb-20 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/50 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500" />
            Cintai Tubuhmu
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl font-semibold tracking-tight">
            Dashboard Diabstroke untuk manajemen program kesehatan.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
            Hindari obat selagi kamu bisa. Olahraga dan jaga kesehatan setiap hari.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signin"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md hover:bg-indigo-700"
            >
              Access Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-white border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              View Dashboard
            </Link>
          </div>

          <div className="mt-14 mx-auto max-w-5xl">
            <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 shadow-2xl shadow-indigo-900/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:bg-white hover:shadow-xl transition">
                  <div className="h-11 w-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                    <span className="font-semibold">D</span>
                  </div>
                  <h3 className="text-lg font-semibold">Diabetes Programs</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Kelola program, status, dan risk level.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:bg-white hover:shadow-xl transition">
                  <div className="h-11 w-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                    <span className="font-semibold">S</span>
                  </div>
                  <h3 className="text-lg font-semibold">Stroke Programs</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    CRUD data dengan loading dan error handling.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col lg:flex-row">
            <div
              className="lg:w-5/12 min-h-[350px] hidden lg:block relative bg-contain bg-no-repeat bg-center transition duration-300 ease-out hover:scale-[1.02]"
              style={{ backgroundImage: "url('/body-human.png')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/70 to-transparent" />
              <div className="absolute bottom-0 left-0 p-10 text-white">
                <h3 className="text-2xl font-semibold">2 Role. 1 Dashboard.</h3>
                <p className="mt-2 text-indigo-100 text-sm max-w-sm">
                  Admin bisa akses halaman admin. User fokus ke program miliknya.
                </p>
              </div>
            </div>

            <div className="lg:w-7/12 p-8 sm:p-12">
              <h2 className="text-2xl font-semibold">Quick Start</h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-700 list-decimal list-inside">
                <li>Buka Sign In.</li>
                <li>Login sebagai user atau admin dari backend kamu.</li>
                <li>Masuk Dashboard. Coba Create, Edit, Delete.</li>
                <li>Jika admin, buka halaman Admin.</li>
              </ol>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/signin"
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-slate-200 flex items-center justify-center text-slate-600">
              <span className="text-xs font-semibold">C</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">DiabStrok</span>
          </div>
          <p className="text-xs text-slate-400">(c) 2026</p>
        </div>
      </footer>
    </div>
  );
}
