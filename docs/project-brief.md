# Diabstrok Project Brief

## 1. Project Category and Scope

- Category: Healthcare booking web application.
- Product focus: platform booking layanan diabetes dan stroke yang menghubungkan pasien dengan admin operasional rumah sakit.
- Scope frontend:
- Landing page
- Sign in
- Sign up
- Dashboard user
- Dashboard admin
- Hospitals
- My bookings
- Admin bookings
- Scope backend:
- Auth module
- Users module
- Hospitals module
- Doctors module
- Rooms module
- Bookings module
- Swagger setup
- Validation, middleware, dan exception filter
- Frontend Next.js hanya bertindak sebagai UI client yang memanggil backend NestJS.

## 2. Comparable Real-world Systems

- Halodoc: referensi untuk alur pencarian layanan kesehatan, booking, dan CTA yang jelas.
- Alodokter: referensi untuk struktur informasi medis yang ringkas dan mudah dipahami user umum.
- Portal rumah sakit / SatuSehat: referensi untuk kebutuhan role admin, data pasien, dan alur operasional layanan.

## 3. User Roles and Core Functionalities

- User role:
- Registrasi akun
- Login
- Melihat daftar rumah sakit
- Memilih dokter
- Memilih ruangan
- Membuat booking
- Melihat booking milik sendiri
- Melihat status dan resep jika sudah tersedia
- Admin role:
- Login
- Melihat semua booking
- Mengubah status booking
- Menambahkan atau mengubah resep
- Menghapus booking bila diperlukan

## 4. User Stories and UI Expectations

- Sebagai user, saya ingin login dengan mudah agar bisa masuk ke dashboard pribadi saya.
- Sebagai user, saya ingin melihat daftar rumah sakit, dokter, dan ruangan agar bisa membuat booking dengan langkah yang jelas.
- Sebagai user, saya ingin melihat booking saya sendiri agar bisa memantau status pemeriksaan.
- Sebagai admin, saya ingin melihat semua booking agar operasional rumah sakit mudah dimonitor.
- Sebagai admin, saya ingin mengubah status dan menambahkan resep agar alur layanan selesai dari satu panel.
- Ekspektasi UI:
- Form memiliki validasi
- Loading dan error state terlihat jelas
- Tombol utama konsisten
- Layout responsif di desktop dan mobile
- Frontend tidak menyimpan data booking sebagai sumber utama

## 5. Initial Data Assumptions

- `users`: `id`, `name`, `email`, `password`, `role`
- `hospitals`: `id`, `name`, `lat`, `lng`
- `doctors`: `id`, `hospitalId`, `name`, `specialty`, `available`
- `rooms`: `id`, `hospitalId`, `name`, `type`, `available`
- `bookings`: `id`, `userId`, `hospitalId`, `doctorId`, `roomId`, `complaint`, `status`, `queueNumber`, `etaMinutes`, `createdAt`
- `prescriptions`: `stage`, `items`, `notes`, `createdAt`, `createdBy`
- Seed accounts:
- Admin: `admin@diabstrok.id / admin1234`
- User: `rina@diabstrok.id / user1234`
- Seed hospital master data:
- RS Taman Harapan Baru
- RS Primaya Lingkar Utara

## 6. Frontend Deliverables Covered

- Global styling system dan color palette tersedia di `src/app/globals.css`.
- Reusable UI components tersedia di `src/app/components/ui`.
- Login dan Register sudah memakai struktur statis yang konsisten.
- Homepage sudah memiliki navbar, footer, dan placeholder content.
- Halaman frontend utama sudah diarahkan untuk memakai backend NestJS melalui `src/app/lib/api.ts`.
- Folder legacy `src/app/api` sudah dihapus agar tidak membingungkan alur backend utama.

## 7. Backend Deliverables Covered

- Backend utama memakai NestJS di folder `backend-Diabstrok`.
- Struktur backend saat ini:
- `src/modules/auth`
- `src/modules/users`
- `src/modules/hospitals`
- `src/modules/doctors`
- `src/modules/rooms`
- `src/modules/bookings`
- `src/common/middleware`
- `src/common/pipes`
- `src/common/filters`
- Swagger tersedia melalui setup global backend.
- Endpoint utama:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /hospitals`
- `GET /doctors`
- `GET /rooms`
- `POST /bookings`
- `GET /bookings/me`
- `GET /bookings`
- `GET /bookings/:id`
- `PATCH /bookings/:id/status`
- `DELETE /bookings/:id`
- `POST /bookings/:id/prescription`

## 8. Current Technical Note

- Arsitektur final sudah memakai frontend Next.js + backend NestJS.
- Swagger dipakai untuk dokumentasi dan testing endpoint backend.
- Postman dipakai untuk pengujian manual flow yang sama dengan frontend.
- Backend sekarang memakai Prisma + SQLite lokal untuk development, jadi data tidak lagi berbasis in-memory.
- JWT bearer token sudah aktif untuk login, auth guard, dan role-based access di endpoint backend.
- Seed data sudah tersedia melalui `prisma/seed.ts` untuk kebutuhan frontend integration, Swagger, dan Postman.
- Frontend sekarang memakai cookie session ringan + local storage agar middleware Next.js bisa melindungi route penting.
