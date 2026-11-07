import { panggilApi } from './api.js'

/* Lonceng notifikasi Kepala Sekolah: menghitung pengajuan siswa masuk berstatus "Diajukan".
   Hanya aktif untuk peran kepala_sekolah. Data diperbarui otomatis tiap 60 detik (saat tab terbuka),
   saat tab kembali aktif, saat pindah halaman, dan setelah Kepala Sekolah menyetujui/menolak. */

const SELANG_MS = 60000
const $ = (id) => document.getElementById(id)

let aktif = false
let pewaktu = null
let urutan = 0

function tampilkan(jumlah) {
    const tombol = $('notif-tombol')
    const angka = $('notif-angka')
    if (!tombol || !angka) return
    const ada = jumlah > 0
    tombol.classList.toggle('notif-aktif', ada)
    angka.hidden = !ada
    angka.textContent = jumlah > 99 ? '99+' : String(jumlah)
    tombol.setAttribute('aria-label', ada
        ? jumlah + ' pengajuan siswa masuk menunggu persetujuan Anda'
        : 'Notifikasi: tidak ada pengajuan yang menunggu persetujuan')
    tombol.title = ada ? jumlah + ' pengajuan menunggu persetujuan' : 'Tidak ada pengajuan baru'
}

export async function segarkanNotifikasi() {
    if (!aktif) return
    const saya = ++urutan
    try {
        const hasil = await panggilApi('mutasiDaftar', { status: 'Diajukan' })
        if (!aktif || saya !== urutan) return
        tampilkan(Number(hasil.total) || 0)
    } catch {
        /* gagal senyap: angka terakhir tetap tampil, dicoba lagi pada siklus berikutnya */
    }
}

function saatTampak() {
    if (document.visibilityState === 'visible') segarkanNotifikasi()
}

export function mulaiNotifikasi(pengguna) {
    hentikanNotifikasi()
    const tombol = $('notif-tombol')
    if (!tombol || !pengguna || pengguna.peran !== 'kepala_sekolah') return
    aktif = true
    tombol.hidden = false
    tampilkan(0)
    segarkanNotifikasi()
    pewaktu = setInterval(saatTampak, SELANG_MS)
    document.addEventListener('visibilitychange', saatTampak)
    window.addEventListener('notif-segarkan', segarkanNotifikasi)
    window.addEventListener('hashchange', segarkanNotifikasi)
}

export function hentikanNotifikasi() {
    aktif = false
    urutan++
    if (pewaktu) clearInterval(pewaktu)
    pewaktu = null
    document.removeEventListener('visibilitychange', saatTampak)
    window.removeEventListener('notif-segarkan', segarkanNotifikasi)
    window.removeEventListener('hashchange', segarkanNotifikasi)
    const tombol = $('notif-tombol')
    if (tombol) { tombol.hidden = true; tombol.classList.remove('notif-aktif') }
    const angka = $('notif-angka')
    if (angka) angka.hidden = true
}