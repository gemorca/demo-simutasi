# SIM Mutasi Siswa - Redesigned UI/UX Modern

Sistem Informasi Mutasi Siswa (SIM Mutasi Siswa) SMP Negeri 1 Tapa dengan antarmuka UI/UX modern, responsif (Mobile, Tablet, Desktop), dan interaktif.

## Fitur Utama UI/UX Baru:
1. **Desain Modern & Responsif**:
   - Layout adaptif untuk Layar HP (Mobile < 640px), Tablet (640px - 1024px), dan Desktop (> 1024px).
   - Sidebar navigasi drawer dengan efek backdrop blur pada perangkat seluler.
   - Kartu data otomatis bertransisi dari tabel di layar besar menjadi tampilan kartu seragam di layar HP.
2. **Sistem Komponen & Estetika**:
   - Skema warna Slate & Royal Blue (`#2563eb`) modern dengan typography Plus Jakarta Sans.
   - Status badge visual yang jelas untuk status **Draft**, **Diajukan**, **Disetujui**, dan **Ditolak**.
   - Modal bottom sheet untuk dialog konfirmasi dan form input di perangkat HP.
3. **Optimasi Kinerja & Aksesibilitas**:
   - Tanpa ketergantungan build tool berat, dapat dijalankan secara langsung lewat browser atau web server lokal.
   - Terintegrasi penuh dengan backend Google Apps Script API yang telah dikonfigurasi pada `config.js`.

## Cara Menjalankan Aplikasi:
1. Ekstrak file ZIP ini ke folder proyek Anda.
2. Buka file `index.html` langsung di peramban (browser) web modern atau jalankan melalui web server lokal (misalnya Live Server VS Code, Laragon, XAMPP, atau Python `http.server`).
3. Pastikan URL Web App Google Apps Script telah disesuaikan pada `config.js`.

## Struktur Direktori:
```
├── assets/
│   ├── favicon.svg
│   └── logo-sekolah.png
├── css/
│   ├── app.css
│   ├── input.css
│   └── komponen.css
├── js/
│   ├── halaman/
│   │   ├── beranda.js
│   │   ├── gantiPassword.js
│   │   ├── kelas.js
│   │   ├── laporan.js
│   │   ├── login.js
│   │   ├── mutasi.js
│   │   ├── pengaturan.js
│   │   ├── pengguna.js
│   │   ├── persetujuan.js
│   │   └── siswa.js
│   ├── api.js
│   ├── app.js
│   ├── excel.js
│   ├── menu.js
│   ├── mutasiDetail.js
│   ├── mutasiFilter.js
│   ├── mutasiForm.js
│   ├── pdf.js
│   ├── periode.js
│   ├── pustaka.js
│   ├── router.js
│   ├── ui.js
│   ├── util.js
│   └── validasi.js
├── config.js
├── index.html
└── README.md
```
