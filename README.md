# Diabstrok Frontend Budi Arief 

Frontend Next.js untuk sistem booking layanan diabetes dan stroke. Aplikasi ini terhubung ke backend NestJS sebagai sumber data utama untuk auth, master data rumah sakit, dokter, ruangan, dan booking.

## Halaman utama
<img width="1907" height="989" alt="image" src="https://github.com/user-attachments/assets/a7a2e8d6-547f-47ea-9042-99ea484d0086" />

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


## ERD 
<img width="692" height="1222" alt="Diagram Tanpa Judul drawio" src="https://github.com/user-attachments/assets/f03847ac-95c4-43b4-a287-354fda549de4" />

## Fitur yang sudah dicakup
- Global styling system dan reusable UI components
- Login/register dengan validasi form
- Cookie-backed route protection via Next middleware
- Dashboard user, admin, dan dokter berbasis live API
- Booking flow dari dokter ke rumah sakit
- Loading state, error state, toast notification, dan confirmation dialog

## Tech frontend & BE
- Menggunakan Nesxjs dan Nestjs 
- Tailwind CSS
- Postgree/Dbeaver (database) Deploy web Neon 
- Postman/Swagger (get,patch,post and delete endpoint/API )

## Keunggulan :
-  Menggunakan Navbar atau Section Ui/Ux dan responsive stabil ketika tampil di mobile & desktop


## Verifikasi Database  Menggunaakan web Neon 
<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/ced25dad-6d1b-46ba-be5a-8ca1a7bc06ed" />


```bash
npm run build
```

## Unit Testing dan Coverage

<img width="735" height="445" alt="image" src="https://github.com/user-attachments/assets/d40b106a-e6de-4ebd-bbf6-29dafc820a9d" />


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

## Deploy Link FE : https://crack-fe-budiarief2806-2.onrender.com/
## Deploy Link Endpoint & BE: https://crack-be-budiarief2806-2.onrender.com/api#/bookings/BookingsController_update
## Deploy Link Dokter : https://crack-be-budiarief2806-2.onrender.com/doctors
## Deploy link hospital : https://crack-be-budiarief2806-2.onrender.com/hospitals
