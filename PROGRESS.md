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
- [x] Fix penting #2: scheduler tidak pernah benar-benar jalan otomatis — `Schedule::everyMinute()` cuma mendefinisikan JADWAL, tidak ada yang men-trigger `php artisan schedule:run` tiap menit. Solusi: tambahkan `php artisan schedule:work` ke `composer run dev` (lihat `composer.json`) supaya scheduler selalu aktif tiap kali dev server dijalankan.
- [ ] **Catatan risiko (belum solved, sifatnya inherent):** koneksi Baileys bisa auto-logout / pesan silently dropped (bahkan sampai status resmi "account restricted" dari WhatsApp) kalau sesi dipakai kirim beruntun/testing manual. Sudah dicoba migrasi ke **WhatsApp Cloud API resmi (Meta)** sebagai alternatif (21 Juli 2026) — secara teknis berhasil terhubung & terverifikasi, tapi mentok di proses **Verifikasi Bisnis Meta** yang mewajibkan dokumen legal badan usaha (tidak berlaku untuk proyek personal/skripsi tanpa badan usaha terdaftar). Diputuskan **kembali ke Baileys**. Kesepakatan ke depan: jangan pernah kirim pesan test manual lagi di luar scheduler asli — biarkan 1 tugas = 1 reminder natural, supaya tidak memicu deteksi spam lagi.

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

## Fitur Laporan (21 Juli 2026)
- [x] Halaman `/laporan` — filter periode (Bulan Ini/Lalu/Tahun Ini/Kustom)
- [x] Ringkasan keuangan (pemasukan/pengeluaran/saldo bersih) per periode
- [x] Breakdown kategori pengeluaran + tren 6 bulan terakhir
- [x] Ringkasan tugas (completion rate) + statistik reminder WA (terkirim/gagal)
- [x] Export PDF (jsPDF + autotable) — layout print-friendly terang, terpisah dari tema gelap aplikasi

## Fitur Pengaturan + Tema Terang/Gelap (21 Juli 2026)
- [x] Sistem tema dark/light penuh — CSS variables di `theme.css` + `ThemeContext`, diterapkan ke Layout/Dashboard/Finances/Todos/Laporan (Login/Register tetap dark-only, keputusan sadar — auth page biasanya brand-fixed)
- [x] Halaman `/pengaturan`: edit profil (avatar inisial), tes koneksi WA, ganti password, kelola sesi login aktif (revoke), hapus akun (dengan konfirmasi ketik "HAPUS")
- [x] Toggle notifikasi WA per-user (`wa_notifications_enabled`) — scheduler cek kolom ini sebelum kirim
- [x] Fix penting #3: nomor WA format lokal (`0...`) sekarang otomatis dinormalisasi ke format internasional (`62...`) via mutator di `User` model — sebelumnya jadi bug berulang (3x kejadian di akun berbeda)

## Redesign Keuangan + Polish Navigasi (24 Juli 2026)
- [x] Redesign halaman `/finances` — hero saldo total (+ persentase perubahan vs bulan lalu), KPI pemasukan/pengeluaran bulanan, form + tabel transaksi dengan pagination, dan insight mingguan yang dihitung otomatis dari data transaksi (bukan teks statis)
- [x] Kategori keuangan: ganti dropdown tetap jadi combobox live-search yang belajar dari riwayat kategori milik user sendiri (bukan lagi daftar hardcoded) — kategori baru otomatis jadi saran berikutnya
- [x] Fix table overflow di tabel transaksi (mobile & desktop) supaya nominal tidak pernah kepotong
- [x] `GuestRoute` di `App.jsx` — user yang sudah login otomatis diarahkan ke dashboard kalau membuka `/login` atau `/register` manual (sebelumnya bisa diakses lagi tanpa redirect)
- [x] Sidebar desktop kini collapse jadi icon rail (logo + ikon saja) dan expand saat hover, gaya Instagram — `components/Layout.jsx`, tidak memengaruhi bottom nav mobile
- [x] Fix: output command `app:send-whatsapp-reminders` diarahkan ke `storage/logs/whatsapp-reminders.log` (`routes/console.php`), sebelumnya dibuang ke `/dev/null` sehingga sukses/gagalnya reminder tidak pernah terlihat

## Redesign Tugas (24 Juli 2026)
- [x] Migration: tambah kolom `category` dan `description` (nullable) ke tabel `todos` + update `Todo` model & `TodoController` validation
- [x] Redesign halaman `/todos` jadi "Manajemen Tugas" — kalender strip mingguan fungsional (klik tanggal untuk filter, navigasi minggu), kartu "Tambah Tugas Cepat" (nama + kategori + jam pengingat WA, tanggal ikut yang dipilih di kalender)
- [x] Kategori tugas: combobox live-search yang sama seperti di Keuangan, belajar dari riwayat kategori milik user
- [x] Kartu Progres Harian (persentase tugas selesai per tanggal terpilih), kartu Kategori (breakdown jumlah tugas per kategori), kartu Peringatan Berikutnya (pengingat WA terdekat + teks relatif, dihitung real-time) — semua dihitung dari data asli, bukan statis
- [x] Toggle "Lihat Semua" vs "Fokus Hari Ini" untuk lihat seluruh tugas di luar tanggal terpilih

## Belum masuk PRD tapi perlu diputuskan nanti
- [ ] Dashboard Admin (statistik, monitoring WA gateway) — role Admin disebut di §3 tapi belum ada detail fungsional
- [ ] Deployment/hosting plan
- [ ] Otentikasi Dua Faktor, upload foto profil asli, pilihan bahasa — sengaja di-skip dulu di halaman Pengaturan (effort besar / belum relevan untuk scope personal saat ini)

---
*Update checklist ini setiap kali sebuah item selesai dikerjakan, agar progres selalu sinkron.*
