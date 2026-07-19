# Project Requirement Document (PRD)
## Aplikasi Manajemen Keuangan & To-Do List Berbasis Mobile-First dengan Integrasi WhatsApp

| | | |
|---|---|---|
| **Nama Aplikasi** | SakuTask | |
| **Pemilik Project** | Ali Imran Rodja | **Institusi:** Universitas Pasundan (UNPAS) |
| **Versi PRD** | v1.0 | **Target Device:** macOS (M1 Pro Development) |
| **Tanggal** | 19 Juli 2026 | |

> **Catatan revisi (19 Juli 2026):** Setelah implementasi awal, arah produk direvisi jadi **dua target aplikasi terpisah**:
> 1. **Aplikasi Desktop (fokus saat ini)** — web app yang sama (React + Tailwind), dibungkus jadi **PWA (Progressive Web App)** supaya bisa di-*install* dan dibuka sebagai aplikasi mandiri (mode `standalone`, tanpa address bar/tab browser), sesuai preferensi pemilik project yang terbiasa membuka aplikasi langsung tanpa masuk ke Chrome.
> 2. **Aplikasi Mobile (fase berikutnya, belum digarap)** — versi khusus mobile (kemungkinan native/React Native), dikerjakan setelah versi desktop stabil.
>
> Layout mobile-first yang sudah dibangun (bottom nav) tetap dipertahankan untuk kompatibilitas — PWA yang sama tetap bisa diinstall di HP — tapi pengembangan fitur baru untuk sementara fokus ke pengalaman desktop.

---

## 1. Latar Belakang & Masalah

Sebagai seorang mahasiswa, pengelolaan keuangan dan efisiensi waktu merupakan tantangan utama sehari-hari. Banyak mahasiswa kesulitan melacak aliran masuk dan keluar uang saku yang diberikan, yang sering kali berujung pada defisit finansial sebelum akhir bulan. Di sisi lain, padatnya aktivitas akademik dan organisasi membuat agenda atau daftar tugas (*to-do list*) kerap kali terlupakan karena tidak adanya sistem pengingat yang proaktif.

Berdasarkan pola perilaku mahasiswa saat ini, platform komunikasi yang paling intensif digunakan untuk interaksi harian adalah **WhatsApp**. Oleh karena itu, membangun sebuah aplikasi web *mobile-first* bernama **SakuTask** yang menggabungkan fitur *financial tracking* dan *task management*, serta terintegrasi langsung dengan notifikasi pengingat real-time via WhatsApp, menjadi solusi paling relevan dan efektif.

## 2. Tujuan Proyek

- Menyediakan platform pencatatan keuangan harian (pendapatan & pengeluaran) yang ringkas dan mudah diakses via smartphone.
- Menyediakan sistem manajemen tugas (*to-do list*) interaktif per hari bagi mahasiswa.
- Mengimplementasikan mesin pengingat (*engine reminder*) otomatis berbasis waktu nyata (*real-time*) yang mengirimkan notifikasi langsung ke akun WhatsApp pengguna.

## 3. Peran & Pengguna Sistem (User Roles)

| Role | Deskripsi & Hak Akses |
|---|---|
| **User (Mahasiswa)** | Melakukan registrasi dengan nomor WhatsApp, mengelola data transaksi keuangan, mengatur agenda/tugas harian, mengatur waktu pengingat (*reminder*), dan menerima pesan notifikasi WhatsApp secara berkala. |
| **Admin** | Mengakses dashboard utama pemantauan sistem, mengelola data dan status aktif pengguna, meninjau statistik penggunaan aplikasi, serta memantau kesehatan koneksi *WhatsApp Gateway service*. |

## 4. Spesifikasi Teknologi (Tech Stack)

Aplikasi ini dibangun menggunakan arsitektur modern terpisah (Decoupled Architecture) dengan spesifikasi:

- **Backend Framework:** Laravel 11+ (Sebagai RESTful API server, Task Scheduler, dan integrasi WhatsApp Service).
- **Frontend Framework:** React.js (Dengan arsitektur *Single Page Application*, Tailwind CSS untuk penataan UI responsif skala mobile, Lucide React untuk icon set).
- **Database Engine:** PostgreSQL (Menangani penyimpanan data relasional terstruktur dengan performa tinggi).
- **WhatsApp Gateway API:** Unofficial/Official library gateway (seperti Baileys, Wwebjs, atau Foni API) yang mendukung integrasi REST API/Webhook untuk pengiriman pesan otomatis.
- **Development Environment:** Dioptimalkan untuk arsitektur Apple Silicon ARM (MacBook Pro M1 Pro) menggunakan Docker/Native PHP & Node environment.

## 5. Arsitektur Data & Skema Database

| Nama Tabel | Kolom & Tipe Data | Deskripsi & Relasi |
|---|---|---|
| **users** | `id` (UUID/BigInt, PK)<br>`name` (Varchar)<br>`email` (Varchar, Unique)<br>`whatsapp_number` (Varchar)<br>`password` (Varchar)<br>`role` (Varchar)<br>`timestamps` | Menyimpan informasi utama akun pengguna dan admin. Kolom `whatsapp_number` menggunakan format kode negara (e.g., 628...). |
| **finances** | `id` (BigInt, PK)<br>`user_id` (BigInt, FK)<br>`type` (Enum: 'in', 'out')<br>`amount` (Numeric/BigInt)<br>`category` (Varchar)<br>`description` (Text)<br>`date` (Date)<br>`timestamps` | Mencatat riwayat keuangan pengguna. Berelasi ke tabel `users`. Kolom `amount` menyimpan nominal transaksi, `type` menentukan apakah pemasukan atau pengeluaran. |
| **todos** | `id` (BigInt, PK)<br>`user_id` (BigInt, FK)<br>`task_name` (Varchar)<br>`status` (Enum: 'pending', 'completed')<br>`due_date` (Date)<br>`reminder_time` (Time)<br>`timestamps` | Menyimpan agenda harian. Memiliki indeks pada kolom `due_date` dan `reminder_time` untuk optimasi pencarian cron job. |
| **wa_logs** | `id` (BigInt, PK)<br>`user_id` (BigInt, FK)<br>`todo_id` (BigInt, FK, Nullable)<br>`status` (Varchar: 'sent', 'failed')<br>`sent_at` (Timestamp) | Log audit pengiriman notifikasi WhatsApp untuk mencegah terjadinya pengiriman ganda pada menit yang sama. |

## 6. Kebutuhan Fungsional (Functional Requirements)

### 6.1. Sistem Autentikasi & Profil

- Pengguna dapat melakukan registrasi mandiri dengan validasi nomor WhatsApp yang wajib diisi.
- Autentikasi API berbasis token menggunakan *Laravel Sanctum*.

### 6.2. Modul Manajemen Keuangan (*Financial Management*)

- **Pencatatan Finansial:** Fitur CRUD transaksi pemasukan dan pengeluaran secara cepat melalui antarmuka mobile.
- **Kategorisasi:** Pilihan kategori dinamis seperti Makanan, Transportasi, Tugas Kuliah, Kosan, dan Hiburan.
- **Dashboard Keuangan:** Tampilan grafik ringkasan alokasi dana bulanan dan visualisasi sisa saldo riil pengguna.

### 6.3. Modul Agenda Harian (*To-Do List*)

- **Manajemen Tugas:** Input daftar tugas harian beserta penentuan tanggal (`due_date`) dan jam pengingat spesifik (`reminder_time`).
- **Status Kontrol:** Fitur *toggle check* untuk menandai tugas yang telah selesai dikerjakan secara *real-time*.

### 6.4. Mesin Pengingat Otomatis via WhatsApp (*WhatsApp Reminder Engine*)

- **Task Scheduler:** Laravel Scheduler dijalankan setiap menit (`* * * * *`) untuk menyaring data agenda berstatus 'pending' yang memiliki waktu pengingat cocok dengan waktu server saat itu.
- **Template Pesan Dinamis:** Pesan WA yang dikirimkan memuat informasi nama tugas beserta rangkuman singkat saldo keuangan terkini agar pengguna selalu tersadar akan kondisi finansialnya.

**Contoh Format Notifikasi WhatsApp:**

> "Halo Ali! 👋 Ini adalah pengingat otomatis dari SakuTask. Waktunya melakukan tugas: *[Nama Tugas]* sekarang. Jangan lupa diselesaikan ya!
> 📊 *Info Keuangan Kamu:* Sisa saldo saat ini: RpX,XXX,XXX. Tetap hemat ya!"

## 7. Alur Implementasi Pengembangan (Roadmap bagi AI Agent)

### Langkah 1: Setup Backend & Database (Laravel & PostgreSQL)
Inisialisasi repositori Laravel 11. Konfigurasi koneksi PostgreSQL pada file `.env`. Jalankan pembuatan *migrations*, *models*, dan *factories* sesuai skema database di atas.

### Langkah 2: Konstruksi RESTful API & Keamanan
Implementasikan Laravel Sanctum untuk proteksi *route*. Bangun API controller untuk CRUD Keuangan, CRUD To-Do List, beserta request validation yang ketat.

### Langkah 3: Integrasi WhatsApp Gateway & Scheduler
Buat layanan *WhatsApp Notification Service* di Laravel. Daftarkan *custom command* ke dalam scheduler internal Laravel (`app/Console/Kernel.php` atau `routes/console.php`) untuk memindai basis data tiap menit dan memicu pengiriman notifikasi WA API.

### Langkah 4: Pembangunan Frontend Mobile-First (React.js)
Instalasi React.js bersama Tailwind CSS. Desain tata letak khusus layar smartphone (*mobile view viewport*). Hubungkan antarmuka dengan RESTful API Laravel untuk modul autentikasi, grafik keuangan, dan daftar tugas interaktif.
