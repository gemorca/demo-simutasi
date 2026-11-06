const SEMUA = ['admin', 'kepala_sekolah']

export const NAMA_PERAN = {
  admin: 'Admin / Petugas TU',
  kepala_sekolah: 'Kepala Sekolah',
}

const DAFTAR_MENU = [
  { id: 'beranda',       label: 'Beranda',        peran: SEMUA,              tersedia: true, ikon: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
  { id: 'kelas',         label: 'Kelas',          peran: ['admin'],          tersedia: true, ikon: 'M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 1h13' },
  { id: 'pengguna',      label: 'Pengguna',       peran: ['admin'],          tersedia: true, ikon: 'M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1a4 4 0 0 0-3-3.9' },
  { id: 'siswa',         label: 'Siswa',          peran: SEMUA,              tersedia: true, ikon: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5' },
  { id: 'imporSiswa',    label: 'Impor Siswa',    peran: ['admin'],          tersedia: true, tampil: false, ikon: 'M12 16V4M7 9l5-5 5 5M4 20h16' },
  { id: 'siswaMasuk',    label: 'Siswa Masuk',    peran: ['admin'],          tersedia: true, ikon: 'M4 12h12M12 7l5 5-5 5M20 4v16' },
  { id: 'persetujuan',   label: 'Persetujuan',    peran: ['kepala_sekolah'], tersedia: true, ikon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M8 12l3 3 5-6' },
  { id: 'laporan',       label: 'Laporan',        peran: SEMUA,              tersedia: true, ikon: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6' },
  { id: 'log',           label: 'Log Aktivitas',  peran: ['admin'],          tersedia: true, tampil: false, ikon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2' },
  { id: 'pengaturan',    label: 'Pengaturan',     peran: ['admin'],          tersedia: true, ikon: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4' },
  { id: 'gantiPassword', label: 'Ganti Password', peran: SEMUA,              tersedia: true, ikon: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3' },
]

export function menuUntuk(peran) {
  return DAFTAR_MENU.filter((m) => m.tampil !== false && m.peran.includes(peran))
}
