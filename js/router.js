export const HALAMAN = {
  beranda: () => import('./halaman/beranda.js'),
  kelas: () => import('./halaman/kelas.js'),
  pengguna: () => import('./halaman/pengguna.js'),
  siswa: () => import('./halaman/siswa.js'),
  siswaMasuk: () => import('./halaman/mutasi.js'),
  persetujuan: () => import('./halaman/persetujuan.js'),
  laporan: () => import('./halaman/laporan.js'),
  pengaturan: () => import('./halaman/pengaturan.js'),
  gantiPassword: () => import('./halaman/gantiPassword.js'),
}

export const TAHAP = {
  imporSiswa: 5, log: 5,
}

export function bacaHalaman() {
  return window.location.hash.replace(/^#\/?/, '') || 'beranda'
}

export function pindah(id) {
  window.location.hash = '/' + id
}

export function saatBerubah(fn) {
  window.addEventListener('hashchange', fn)
}
