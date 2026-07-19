# SakuTask — Progress Tracker

Referensi: [PRD_SakuTask.md](PRD_SakuTask.md) (roadmap bagian 7)

## Langkah 1: Setup Backend & Database (Laravel & PostgreSQL)
- [ ] Inisialisasi repositori Laravel 11
- [ ] Konfigurasi koneksi PostgreSQL (`.env`)
- [ ] Migration: `users` (tambah `whatsapp_number`, `role`)
- [ ] Migration: `finances`
- [ ] Migration: `todos`
- [ ] Migration: `wa_logs`
- [ ] Models + relasi (User, Finance, Todo, WaLog)
- [ ] Factories/seeders dasar

## Langkah 2: RESTful API & Keamanan
- [ ] Setup Laravel Sanctum (register/login/logout)
- [ ] API CRUD Finances + validation
- [ ] API CRUD Todos + validation
- [ ] Route protection (middleware auth:sanctum, role check admin)

## Langkah 3: Integrasi WhatsApp Gateway & Scheduler
- [ ] Pilih & pasang library gateway WA (Baileys/Wwebjs/Foni API)
- [ ] WhatsApp Notification Service
- [ ] Scheduler command (`* * * * *`) — scan todos pending sesuai reminder_time
- [ ] Template pesan dinamis (nama tugas + saldo)
- [ ] Logging ke `wa_logs` (cegah duplikat pengiriman)

## Langkah 4: Frontend Mobile-First (React.js)
- [ ] Setup React.js + Tailwind CSS + Lucide React (icon set)
- [ ] Layout mobile-first
- [ ] Halaman auth (register/login)
- [ ] Dashboard keuangan (grafik + saldo)
- [ ] Halaman to-do list (CRUD + toggle check)
- [ ] Integrasi ke API Laravel

## Belum masuk PRD tapi perlu diputuskan nanti
- [ ] Dashboard Admin (statistik, monitoring WA gateway) — role Admin disebut di §3 tapi belum ada detail fungsional
- [ ] Deployment/hosting plan

---
*Update checklist ini setiap kali sebuah item selesai dikerjakan, agar progres selalu sinkron.*
