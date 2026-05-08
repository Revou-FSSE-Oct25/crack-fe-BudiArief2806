# Frontend E2E Checklist

Checklist ini dipakai untuk final demo, manual QA, dan verifikasi alur end-to-end ketika frontend Next.js terhubung ke backend NestJS yang sama.

## Environment

1. Jalankan backend di `http://localhost:3001`.
2. Jalankan frontend di `http://localhost:3000`.
3. Pastikan `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`.
4. Seed backend dengan `npm run prisma:seed`.

## Auth Flow

1. Buka `/signup` lalu daftar user baru.
2. Pastikan muncul pesan sukses dan diarahkan ke `/signin`.
3. Login sebagai user.
4. Pastikan route `/dashboard` dan `/my-bookings` bisa dibuka.
5. Logout lalu buka `/dashboard`.
6. Pastikan middleware mengarahkan ke `/signin`.

## User Booking Flow

1. Buka `/doctors` lalu pilih dokter.
2. Pastikan user diarahkan ke `/hospitals` dengan query dokter/rumah sakit yang relevan.
3. Buat booking baru.
4. Pastikan muncul notifikasi sukses lalu diarahkan ke `/my-bookings`.
5. Ubah status booking.
6. Hapus booking dan pastikan ada confirmation dialog.

## Admin Flow

1. Login sebagai `admin@diabstrok.id`.
2. Buka `/admin` lalu `/admin/bookings`.
3. Kirim booking milik user ke dokter.
4. Pastikan status berubah menjadi menunggu review dokter.

## Doctor Flow

1. Login sebagai `siti@diabstrok.id`.
2. Buka `/doctor` lalu `/doctor/bookings`.
3. Isi diagnosis, estimasi biaya, resep, dan saran kesehatan.
4. Pastikan status berubah menjadi review dokter selesai.

## Admin Finalization Flow

1. Kembali login sebagai `admin@diabstrok.id`.
2. Buka `/admin/bookings`.
3. Pastikan hasil review dokter terlihat di panel admin.
4. Selesaikan kasus dari admin.
5. Pastikan booking selesai dan hasil dokter tetap terlihat di tabel admin.

## Error and Edge Cases

1. Coba login dengan password salah.
2. Coba submit booking tanpa dokter atau ruangan.
3. Coba akses `/admin` sebagai user biasa.
4. Coba akses route terlindungi setelah logout.

## Release Gate

- Frontend build harus lolos dengan `npm run build`.
- Backend build harus lolos dengan `npm run build`.
- Backend e2e harus lolos dengan `npm run test:e2e -- --runInBand`.
