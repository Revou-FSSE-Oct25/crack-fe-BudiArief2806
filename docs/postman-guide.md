# Postman Guide

## Base URL

- Backend NestJS base URL: `http://localhost:3001`
- Swagger URL: `http://localhost:3001/api`

## Recommended Local Setup

1. Jalankan backend NestJS dari folder `backend-Diabstrok` dengan `npm run start:dev`.
2. Jalankan frontend Next.js dari folder `nextlove`.
3. Pastikan frontend memakai `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`.
4. Import koleksi Postman yang akan dipakai untuk endpoint NestJS.

## Recommended Request Flow

1. `POST /auth/login`
2. Simpan `accessToken` dari response login ke variable Postman `token`
3. `GET /auth/me`
4. `GET /hospitals`
5. `GET /doctors`
6. Untuk admin: `PATCH /doctors/:id/availability`
7. `GET /rooms?hospitalId=<hospitalId>&doctorId=<doctorId>`
8. Untuk admin: `PATCH /doctors/:doctorId/rooms/:roomId/availability`
9. Bila perlu: `PATCH /rooms/:id/availability` untuk menutup ruangan secara global di rumah sakit
10. `POST /bookings`
11. `GET /bookings/me`
12. Untuk admin: `GET /bookings`
13. Untuk admin: `PATCH /bookings/:id/status`
14. Untuk dokter: `POST /bookings/:id/doctor-review`
15. Bila perlu: `POST /bookings/:id/prescription`
16. Bila perlu: `DELETE /bookings/:id`

## Seed Credentials

- Admin: `admin@diabstrok.id / admin1234`
- Doctor: `siti@diabstrok.id / doctor1234`
- User: `rina@diabstrok.id / user1234`

## Notes

- Frontend dan Postman harus memakai endpoint backend NestJS yang sama.
- Availability ruangan sekarang bisa spesifik per dokter, jadi gunakan `doctorId` saat mengecek room.
- Folder `src/app/api` yang lama sudah dihapus agar frontend hanya punya satu sumber backend yang jelas.
- Swagger dan Postman dipakai untuk memverifikasi endpoint backend yang sama dengan yang dipanggil frontend.
- Backend saat ini memakai Prisma dengan SQLite lokal untuk development.
- Koleksi Postman harus mengarah ke endpoint auth, hospitals, doctors, rooms, dan bookings milik backend NestJS.
