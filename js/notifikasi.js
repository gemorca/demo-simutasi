import { panggilApi } from './api.js'
import { bacaHalaman, pindah } from './router.js'
import { esc } from './ui.js'

/* Notifikasi Kepala Sekolah: lonceng + panel kecil berisi pengajuan siswa masuk yang menunggu persetujuan.
   - Hanya aktif untuk peran kepala_sekolah.
   - Angka merah (dan kedip) = jumlah yang BELUM dibaca. "Tandai dibaca" disimpan per akun di perangkat ini.
   - Klik satu notifikasi: ditandai dibaca lalu langsung membuka detail pengajuan di halaman Persetujuan. */

const SELANG_MS = 60000
const KUNCI_BUKA = 'sim_buka_mutasi' // dibaca oleh halaman Persetujuan untuk langsung membuka detail
const $ = (id) => document.getElementById(id)

let aktif = false
let pewaktu = null
let urutan = 0
let terpasang = false
let penggunaId = ''
let daftar = []
let sudahMuat = false
let gagal = false
let baca = new Set()

const kunci = (m) => m.id + '|' + (m.tanggal_diajukan || '')
const kunciSimpan = () => 'sim_notif_baca:' + penggunaId

function muatBaca() {
  try { return new Set(JSON.parse(localStorage.getItem(kunciSimpan())) || []) } catch { return new Set() }
}
function simpanBaca() {
  try { localStorage.setItem(kunciSimpan(), JSON.stringify([...baca])) } catch { /* penyimpanan tidak tersedia */ }
}

const belumDibaca = () => daftar.filter((m) => !baca.has(kunci(m)))
const panelTerbuka = () => !$('notif-panel').hidden

function bukaPanel(buka) {
  $('notif-panel').hidden = !buka
  $('notif-tombol').setAttribute('aria-expanded', String(buka))
  if (buka) { gambarPanel(); segarkanNotifikasi() }
}

function gambarTombol() {
  const tombol = $('notif-tombol')
  const angka = $('notif-angka')
  const n = belumDibaca().length
  tombol.classList.toggle('notif-aktif', n > 0)
  angka.hidden = n === 0
  angka.textContent = n > 99 ? '99+' : String(n)
  tombol.setAttribute('aria-label', n > 0
    ? n + ' notifikasi baru: pengajuan siswa masuk menunggu persetujuan Anda'
    : 'Notifikasi (tidak ada yang baru)')
}

function gambarPanel() {
  const panel = $('notif-panel')
  if (panel.hidden) return
  const baru = belumDibaca().length
  let isi
  if (!sudahMuat) {
    isi = `<p class="px-4 py-6 text-center text-sm font-medium text-slate-500">${gagal ? 'Gagal memuat notifikasi. Coba lagi sebentar.' : 'Memuat notifikasi...'}</p>`
  } else if (!daftar.length) {
    isi = '<p class="px-4 py-8 text-center text-sm font-medium text-slate-500">Tidak ada pengajuan yang menunggu persetujuan.</p>'
  } else {
    isi = `<ul class="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">${daftar.map((m) => {
      const k = kunci(m)
      const baru1 = !baca.has(k)
      return `<li class="flex items-start gap-2 px-3 py-3 ${baru1 ? 'bg-blue-50/60' : ''}">
        <button type="button" data-aksi="buka" data-id="${esc(m.id)}" data-kunci="${esc(k)}" class="flex min-w-0 flex-1 items-start gap-3 rounded-xl p-1 text-left hover:bg-slate-100/80">
          <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${baru1 ? 'bg-rose-500' : 'bg-slate-300'}" aria-hidden="true"></span>
          <span class="min-w-0">
            <span class="block text-sm ${baru1 ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}">Pengajuan siswa masuk menunggu keputusan</span>
            <span class="mt-0.5 block truncate text-sm font-semibold text-blue-700">${esc(m.nama_siswa)}${m.nama_kelas ? ' &middot; ' + esc(m.nama_kelas) : ''}</span>
            <span class="mt-0.5 block text-xs font-medium text-slate-500">Diajukan oleh ${esc(m.diajukan_oleh || '-')}${m.tanggal_diajukan ? ' &middot; ' + esc(m.tanggal_diajukan) : ''}</span>
          </span>
        </button>
        ${baru1 ? `<button type="button" data-aksi="baca" data-kunci="${esc(k)}" class="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50">Tandai dibaca</button>` : ''}
      </li>`
    }).join('')}</ul>`
  }
  panel.innerHTML = `<div class="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
      <strong class="text-sm font-bold text-slate-900">Notifikasi${baru ? ` <span class="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">${baru} baru</span>` : ''}</strong>
      ${baru ? '<button type="button" data-aksi="semua" class="text-xs font-semibold text-blue-600 hover:underline">Tandai semua dibaca</button>' : ''}
    </div>${isi}
    <div class="border-t border-slate-100 p-2"><button type="button" data-aksi="persetujuan" class="w-full rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50">Buka halaman Persetujuan</button></div>`
}

function gambar() { gambarTombol(); gambarPanel() }

function keHalamanPersetujuan(id) {
  try { if (id) sessionStorage.setItem(KUNCI_BUKA, id) } catch { /* abaikan */ }
  if (bacaHalaman() === 'persetujuan') window.dispatchEvent(new Event('hashchange'))
  else pindah('persetujuan')
}

function saatKlikPanel(e) {
  const t = e.target.closest('[data-aksi]')
  if (!t) return
  const aksi = t.dataset.aksi
  if (aksi === 'baca') { baca.add(t.dataset.kunci); simpanBaca(); gambar() }
  else if (aksi === 'semua') { daftar.forEach((m) => baca.add(kunci(m))); simpanBaca(); gambar() }
  else if (aksi === 'buka') {
    baca.add(t.dataset.kunci); simpanBaca(); gambar()
    bukaPanel(false)
    keHalamanPersetujuan(t.dataset.id)
  } else if (aksi === 'persetujuan') { bukaPanel(false); keHalamanPersetujuan('') }
}

function saatKlikLuar(e) {
  if (panelTerbuka() && !$('notif').contains(e.target)) bukaPanel(false)
}
function saatTombolTekan(e) {
  if (e.key === 'Escape' && panelTerbuka()) { bukaPanel(false); $('notif-tombol').focus() }
}

export async function segarkanNotifikasi() {
  if (!aktif) return
  const saya = ++urutan
  try {
    const hasil = await panggilApi('mutasiDaftar', { status: 'Diajukan' })
    if (!aktif || saya !== urutan) return
    daftar = hasil.daftar || []
    sudahMuat = true
    gagal = false
    // buang tanda baca untuk pengajuan yang sudah tidak menunggu
    const hidup = new Set(daftar.map(kunci))
    const sisa = [...baca].filter((k) => hidup.has(k))
    if (sisa.length !== baca.size) { baca = new Set(sisa); simpanBaca() }
  } catch {
    if (!sudahMuat) gagal = true
  }
  if (aktif && saya === urutan) gambar()
}

function saatTampak() {
  if (document.visibilityState === 'visible') segarkanNotifikasi()
}

export function mulaiNotifikasi(pengguna) {
  hentikanNotifikasi()
  if (!$('notif') || !pengguna || pengguna.peran !== 'kepala_sekolah') return
  aktif = true
  penggunaId = pengguna.id || pengguna.username || 'kepsek'
  baca = muatBaca()
  daftar = []
  sudahMuat = false
  gagal = false
  if (!terpasang) {
    terpasang = true
    $('notif-tombol').addEventListener('click', () => bukaPanel(!panelTerbuka()))
    $('notif-panel').addEventListener('click', saatKlikPanel)
    document.addEventListener('pointerdown', saatKlikLuar)
    document.addEventListener('keydown', saatTombolTekan)
  }
  $('notif').hidden = false
  bukaPanel(false)
  gambarTombol()
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
  const wadah = $('notif')
  if (wadah) {
    wadah.hidden = true
    $('notif-panel').hidden = true
    $('notif-panel').innerHTML = ''
    $('notif-tombol').classList.remove('notif-aktif')
    $('notif-angka').hidden = true
  }
}