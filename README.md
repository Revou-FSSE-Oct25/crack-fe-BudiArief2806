# Diabstrok Frontend

Frontend Next.js untuk sistem booking layanan diabetes dan stroke. Aplikasi ini terhubung ke backend NestJS sebagai sumber data utama untuk auth, master data rumah sakit, dokter, ruangan, dan booking.

## Halaman utama

- `/`
- `/signin`
- `/signup`
- `/dashboard`
- `/doctor`
- `/doctor/bookings`
- `/doctors`
- `/hospitals`
- `/my-bookings`
- `/admin`
- `/admin/bookings`

## Fitur yang sudah dicakup

- Global styling system dan reusable UI components
- Login/register dengan validasi form
- Cookie-backed route protection via Next middleware
- Dashboard user, admin, dan dokter berbasis live API
- Booking flow dari dokter ke rumah sakit
- Loading state, error state, toast notification, dan confirmation dialog

## Menjalankan frontend

```bash
npm install
npm run dev
```

Pastikan environment:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Verifikasi

```bash
npm run build
```

## Unit Testing dan Coverage

```bash
npm run test
npm run test:cov
```

Coverage frontend saat ini dilaporkan oleh Vitest ke folder `coverage/` dengan
reporter `text`, `text-summary`, `json-summary`, dan `lcov`.

Snapshot coverage FE terbaru:

- Statements: `92.08%`
- Branches: `82.65%`
- Functions: `96.42%`
- Lines: `99.17%`

Scope coverage frontend saat ini difokuskan pada lapisan unit yang paling stabil
untuk integrasi aplikasi:

- `src/app/lib/auth.ts`
- `src/app/lib/api.ts`
- `src/app/lib/schemas.ts`
- `src/app/lib/types.ts`

Untuk alur end-to-end manual, lihat `docs/e2e-checklist.md`.

