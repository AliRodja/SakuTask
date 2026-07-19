# SakuTask — Progress Tracker

Referensi: [PRD_SakuTask.md](PRD_SakuTask.md) (roadmap bagian 7)

## Langkah 1: Setup Backend & Database (Laravel & PostgreSQL)
- [x] Inisialisasi repositori Laravel 11
- [x] Konfigurasi koneksi PostgreSQL (`.env`)
- [x] Migration: `users` (tambah `whatsapp_number`, `role`)
- [x] Migration: `finances`
- [x] Migration: `todos`
- [x] Migration: `wa_logs`
- [x] Models + relasi (User, Finance, Todo, WaLog)
- [x] Factories dasar (`-f` flag saat `make:model`)

## Langkah 2: RESTful API & Keamanan
- [x] Setup Laravel Sanctum (register/login/logout) — sudah diverifikasi via curl (register, login, /api/user protected)
- [x] API CRUD Finances + validation — CRUD via apiResource, ownership check per user
- [x] API CRUD Todos + validation — CRUD via apiResource, ownership check per user
- [x] Route protection (middleware auth:sanctum) — semua route CRUD di dalam grup auth:sanctum
- [ ] Role check khusus admin (belum diimplementasi, belum ada endpoint admin)

## Langkah 3: Integrasi WhatsApp Gateway & Scheduler
- [x] Pilih & pasang library gateway WA — Baileys (Node.js service di `whatsapp-service/`, port 3001)
- [x] WhatsApp Notification Service — `app/Services/WhatsAppNotificationService.php`
- [x] Scheduler command — `app:send-whatsapp-reminders` (`routes/console.php`, `everyMinute()`)
- [x] Template pesan dinamis (nama tugas + saldo)
- [x] Logging ke `wa_logs` (cegah duplikat pengiriman dalam menit yang sama)
- [x] Fix penting: `APP_TIMEZONE` di `.env` diubah dari `UTC` ke `Asia/Jakarta` — tanpa ini reminder_time tidak akan pernah cocok dengan waktu server
- [ ] **Catatan risiko (belum solved, sifatnya inherent):** koneksi Baileys bisa auto-logout / pesan silently dropped kalau sesi baru di-link lalu langsung dipakai kirim beruntun (dideteksi WhatsApp sebagai spam). Kode & alur teknis sudah diverifikasi benar (message key + status PENDING dikembalikan, log wa_logs tercatat). Perlu testing lebih santai (jeda antar pesan) saat lanjut development, dan pertimbangkan provider resmi/berbayar kalau mau reliability lebih tinggi di production.

## Langkah 4: Frontend Mobile-First (React.js)
- [x] Setup React.js + Tailwind CSS + Lucide React (icon set)
- [x] Layout mobile-first — bottom nav di mobile, sidebar responsive di desktop (`lg:` breakpoint)
- [x] Halaman auth (register/login) — `pages/Login.jsx`, `pages/Register.jsx`, `context/AuthContext.jsx`
- [x] Dashboard keuangan (grafik + saldo) — `pages/Dashboard.jsx`: hero saldo, KPI pemasukan/pengeluaran, bar chart kategori
- [x] Halaman to-do list (CRUD + toggle check) — `pages/Todos.jsx`
- [x] Halaman keuangan (CRUD) — `pages/Finances.jsx`
- [x] Integrasi ke API Laravel — `lib/api.js` (axios + Bearer token interceptor)

## Langkah 5: PWA Desktop App (revisi arah, 19 Juli 2026)
- [x] Buat ikon app (`frontend/public/icon.svg` + PNG 192x192 & 512x512)
- [x] Install & konfigurasi `vite-plugin-pwa`
- [x] Manifest: nama, theme color, `display: standalone`
- [x] Build & tes install sebagai app desktop (buka tanpa address bar) — berhasil di-install & dites
- [ ] (Nanti, belum digarap) Aplikasi mobile terpisah

## Polish UX (19 Juli 2026)
- [x] `lib/api.js`: interceptor error jaringan/API jadi pesan yang ramah (`friendlyMessage`)
- [x] `components/Spinner.jsx`: loading indicator reusable
- [x] Loading state di Dashboard, Finances, Todos saat fetch data
- [x] Cegah submit ganda (disable tombol + teks "Menyimpan.../Memproses...") di semua form: Login, Register, Todos, Finances

## Belum masuk PRD tapi perlu diputuskan nanti
- [ ] Dashboard Admin (statistik, monitoring WA gateway) — role Admin disebut di §3 tapi belum ada detail fungsional
- [ ] Deployment/hosting plan

---
*Update checklist ini setiap kali sebuah item selesai dikerjakan, agar progres selalu sinkron.*
