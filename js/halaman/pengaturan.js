import { panggilApi } from '../api.js'
import {
  esc, KELAS, memuat, judulHalaman, medan, tandaiGalat, bersihkanGalat, bacaForm,
  sibukSimpan, galatMuat, lencana, pasangAksi, notif,
} from '../ui.js'

const LABEL = {
  nama_sekolah: 'Nama sekolah',
  npsn: 'NPSN (8 digit)',
  alamat_sekolah: 'Alamat sekolah',
  nama_kepala_sekolah: 'Nama Kepala Sekolah',
  nip_kepala_sekolah: 'NIP Kepala Sekolah',
  tahun_ajaran_aktif: 'Tahun ajaran aktif (contoh 2026/2027)',
}
const KOLOM = Object.keys(LABEL)
const PENUH = ['nama_sekolah', 'alamat_sekolah']

const aman = (url) => /^https?:\/\//i.test(String(url || ''))

function htmlProfil(profil) {
  const kolom = KOLOM.map((k) => medan({
    label: LABEL[k], nama: k, nilai: profil[k], penuh: PENUH.includes(k),
    atribut: k === 'npsn' ? { inputmode: 'numeric' } : {},
  })).join('')
  return `<h3 class="mb-4 text-lg font-bold text-slate-900">Profil Sekolah</h3>
    <form data-profil novalidate>
      <div class="grid gap-5 sm:grid-cols-2">${kolom}</div>
      <div class="mt-8 flex justify-end border-t border-slate-100 pt-5">
        <button type="submit" data-simpan class="${KELAS.utama}">Simpan Profil</button></div>
    </form>`
}

function htmlBackup(backup, sibuk) {
  const aktif = Boolean(backup.trigger_aktif)
  return `<h3 id="set-backup" class="mb-4 text-lg font-bold text-slate-900">Backup Database</h3>
    <p class="mb-2.5 text-sm font-medium text-slate-700">Backup terakhir: <strong class="text-slate-900">${esc(backup.terakhir || 'belum pernah')}</strong></p>
    <p class="mb-2.5 text-sm font-medium text-slate-700 flex items-center gap-2">Backup otomatis harian: ${lencana(aktif ? 'Disetujui' : 'Ditolak', aktif ? 'Aktif' : 'Belum aktif')}</p>
    ${aktif ? '' : '<p class="mb-3 text-xs font-semibold text-slate-400">Jalankan fungsi <code>pasangBackupHarian</code> di editor Apps Script.</p>'}
    ${sibuk ? '<p role="status" class="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800">Membuat backup database...</p>' : ''}
    <div class="mt-5 flex flex-wrap gap-3">
      <button type="button" data-aksi="backup" class="${KELAS.utama}"${sibuk ? ' disabled' : ''}>${sibuk ? 'Membuat backup...' : 'Backup Sekarang'}</button>
      ${aman(backup.folder_url) ? `<a href="${esc(backup.folder_url)}" target="_blank" rel="noopener noreferrer" class="${KELAS.tombol}">Buka Folder Backup Google Drive</a>` : ''}
    </div>`
}

export function render(wadah) {
  wadah.innerHTML = `<div class="mx-auto max-w-4xl">
    ${judulHalaman({ judul: 'Pengaturan Sistem', sub: 'Atur profil sekolah (tercetak di laporan) dan cadangan database.' })}
    <div data-isi>${memuat('Memuat pengaturan...')}</div></div>`
  const isi = wadah.querySelector('[data-isi]')

  let backup = null
  let sibukBackup = false
  let urutan = 0

  const panelBackup = () => isi.querySelector('[data-backup]')
  const gambarBackup = () => { if (panelBackup()) panelBackup().innerHTML = htmlBackup(backup, sibukBackup) }

  function gambar(profil) {
    isi.innerHTML = `<section class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm" aria-label="Profil sekolah" data-panel-profil>${htmlProfil(profil)}</section>
      <section class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm" aria-labelledby="set-backup" data-backup></section>`
    gambarBackup()
    pasangForm(isi.querySelector('[data-profil]'))
  }

  function pasangForm(form) {
    form.addEventListener('input', (e) => { if (e.target.name) bersihkanGalat(form, e.target.name) })
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      tandaiGalat(form, {})
      const profil = bacaForm(form, KOLOM)
      sibukSimpan(form, true)
      try {
        const hasil = await panggilApi('pengaturanSimpan', { profil })
        notif.sukses(hasil.pesan || 'Pengaturan berhasil disimpan.')
      } catch (err) {
        notif.galat(err.message)
      } finally {
        if (form.isConnected) sibukSimpan(form, false)
      }
    })
  }

  async function muat({ penuh = true } = {}) {
    const saya = ++urutan
    try {
      const hasil = await panggilApi('pengaturanAmbil')
      if (saya !== urutan || !isi.isConnected) return
      backup = hasil.backup
      if (penuh) gambar(hasil.profil)
      else gambarBackup()
    } catch (err) {
      if (saya !== urutan || !isi.isConnected) return
      if (penuh) isi.innerHTML = galatMuat('Pengaturan tidak dapat dimuat. ' + err.message)
      else notif.galat(err.message)
    }
  }

  async function backupSekarang() {
    if (sibukBackup) return
    sibukBackup = true
    gambarBackup()
    try {
      const hasil = await panggilApi('backupSekarang')
      notif.sukses('Backup berhasil dibuat: ' + hasil.nama)
      sibukBackup = false
      await muat({ penuh: false })
    } catch (err) {
      notif.galat(err.message)
    } finally {
      sibukBackup = false
      if (isi.isConnected && backup) gambarBackup()
    }
  }

  pasangAksi(isi, { 'muat-ulang': () => { isi.innerHTML = memuat('Memuat pengaturan...'); muat() }, backup: backupSekarang })
  muat()
}
