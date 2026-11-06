import { panggilApi } from '../api.js'
import {
  esc, KELAS, IKON, memuat, judulHalaman, medan, tandaiGalat, bersihkanGalat, bacaForm, barSimpan, sibukSimpan,
  galatMuat, tabel, lencana, isiUlang, pasangAksi, pilihanMassal, barAlat, barAksiBawah, ringkasanMassal,
  dialogKonfirmasi, tampilPesan, notif,
} from '../ui.js'
import { NAMA_PERAN } from '../menu.js'
import { periksa, wajib, minPanjang } from '../validasi.js'

const IK_ORANG = 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'
const SATUAN = 'pengguna'

const ATURAN_DASAR = {
  nama: [wajib('Nama wajib diisi')],
  username: [wajib('Username wajib diisi')],
  peran: [wajib('Pilih peran')],
}
const ATURAN_BARU = {
  nama: ATURAN_DASAR.nama,
  username: ATURAN_DASAR.username,
  password: [wajib('Password awal wajib diisi'), minPanjang(8, 'Password minimal 8 karakter')],
  peran: ATURAN_DASAR.peran,
}
const PILIHAN_PERAN = Object.keys(NAMA_PERAN).map((p) => ({ nilai: p, label: NAMA_PERAN[p] }))

export function render(wadah, saya) {
  let daftar = []
  let sibuk = false
  let layar = 0
  const pilihan = pilihanMassal()

  const idStr = (u) => String(u.id)
  const cari = (id) => daftar.find((u) => idStr(u) === String(id))
  const sendiri = (u) => idStr(u) === String(saya.id)
  const bisaDipilih = () => daftar.filter((u) => !sendiri(u))

  function gambarIsi() {
    const isi = wadah.querySelector('[data-isi]')
    if (!isi) return
    isiUlang(isi,
      barAlat({ pilihan, total: bisaDipilih().length, satuan: SATUAN, sibuk })
      + tabel({
        kolom: [
          { judul: 'Nama', html: (u) => `<strong class="text-slate-900">${esc(u.nama)}</strong>` },
          { judul: 'Username', nilai: (u) => u.username },
          { judul: 'Peran', nilai: (u) => NAMA_PERAN[u.peran] || u.peran },
          { judul: 'Status', rata: 'tengah', html: (u) => lencana(u.aktif ? 'Aktif' : 'Nonaktif') },
        ],
        baris: daftar,
        aksi: (u) => [
          { aksi: 'ubah', label: 'Ubah', d: IKON.ubah },
          { aksi: 'reset', label: 'Reset password', d: IKON.kunci },
          ...(sendiri(u) ? [] : [{ aksi: 'aktif', label: u.aktif ? 'Nonaktifkan' : 'Aktifkan', d: IKON.aktif, bahaya: u.aktif }]),
        ],
        pilih: {
          aktif: pilihan.aktif,
          ada: (id) => pilihan.ada(String(id)),
          semua: pilihan.semuaDipilih,
          sebagian: pilihan.sebagian,
          label: (u) => (sendiri(u) ? 'Akun sendiri tidak dapat dihapus' : 'Pilih pengguna ' + u.username),
          nonaktif: sendiri,
        },
        kosong: {
          ikon: IK_ORANG, judul: 'Belum ada pengguna',
          teks: 'Buat akun Admin / Petugas TU atau Kepala Sekolah lewat tombol Tambah Pengguna.',
        },
      })
      + barAksiBawah({ pilihan, satuan: SATUAN, sibuk }))
  }

  async function muat() {
    const id = layar
    const isi = wadah.querySelector('[data-isi]')
    isi.innerHTML = memuat()
    try {
      const hasil = await panggilApi('penggunaDaftar')
      if (id !== layar || !wadah.isConnected) return
      daftar = hasil
      pilihan.setDaftar(bisaDipilih().map(idStr))
      gambarIsi()
    } catch (err) {
      if (id !== layar || !wadah.isConnected) return
      isi.innerHTML = galatMuat(err.message)
    }
  }

  function tampilDaftar(segar = true) {
    layar++
    pilihan.selesai()
    sibuk = false
    wadah.innerHTML = judulHalaman({
      judul: 'Kelola Pengguna',
      sub: 'Manajemen akun Admin / Petugas TU dan Kepala Sekolah.',
      aksi: `<button type="button" data-aksi="tambah" class="${KELAS.utama}">+ Tambah Pengguna</button>`,
    }) + '<div data-isi></div>'
    pasangAksi(wadah, PETA_DAFTAR)
    if (segar) return muat()
    gambarIsi()
  }

  async function gantiAktif(u) {
    if (!u || sendiri(u)) return
    try {
      await panggilApi('penggunaAktif', { id: u.id, aktif: !u.aktif })
      tampilPesan({ jenis: 'sukses', teks: u.username + (u.aktif ? ' dinonaktifkan' : ' diaktifkan') })
      if (wadah.isConnected) muat()
    } catch (err) {
      tampilPesan({ jenis: 'galat', teks: err.message })
    }
  }

  async function reset(u) {
    if (!u) return
    const ya = await dialogKonfirmasi({
      judul: 'Reset password?',
      pesan: 'Password ' + u.username + ' akan diganti dengan password baru yang dibuat otomatis.',
      ya: 'Reset password',
    })
    if (!ya) return
    try {
      const hasil = await panggilApi('penggunaResetPassword', { id: u.id })
      tampilPesan({
        jenis: 'sukses',
        tetap: true,
        judul: 'Password Baru Berhasil Dibuat',
        tombol: 'Sudah saya catat',
        teks: 'Password baru untuk ' + hasil.username + ': ' + hasil.passwordBaru + ' (catat sekarang, tidak akan ditampilkan lagi)',
      })
    } catch (err) {
      tampilPesan({ jenis: 'galat', teks: err.message })
    }
  }

  async function hapusTerpilih() {
    const n = pilihan.jumlah
    if (!n || sibuk) return
    const ya = await dialogKonfirmasi({
      judul: 'Hapus ' + n + ' pengguna?',
      pesan: 'Akun terpilih akan dihapus permanen dan tidak bisa login lagi. Data tidak dapat dikembalikan.',
      ya: 'Hapus ' + n + ' pengguna',
      bahaya: true,
    })
    if (!ya || !wadah.isConnected) return
    sibuk = true
    gambarIsi()
    try {
      const ids = pilihan.daftarId.map((id) => (cari(id) || {}).id)
      const hasil = await panggilApi('penggunaBulkDestroy', { ids })
      tampilPesan(ringkasanMassal(hasil, SATUAN))
      pilihan.selesai()
    } catch (err) {
      tampilPesan({ jenis: 'galat', teks: err.message })
    }
    sibuk = false
    if (wadah.isConnected) muat()
  }

  const PETA_DAFTAR = {
    tambah: () => tampilForm(null),
    ubah: (id) => { const u = cari(id); if (u) tampilForm(u) },
    reset: (id) => reset(cari(id)),
    aktif: (id) => gantiAktif(cari(id)),
    'mulai-pilih': () => { pilihan.mulai(); gambarIsi() },
    'selesai-pilih': () => { pilihan.selesai(); gambarIsi() },
    'pilih-semua': () => { pilihan.balikSemua(); gambarIsi() },
    pilih: (id) => { pilihan.balik(id); gambarIsi() },
    'hapus-terpilih': hapusTerpilih,
    'muat-ulang': () => muat(),
  }

  function tampilForm(u) {
    const id = ++layar
    const ubah = Boolean(u)
    const nilai = ubah ? { nama: u.nama, username: u.username, peran: u.peran } : { nama: '', username: '', peran: '' }

    wadah.innerHTML = judulHalaman({
      judul: ubah ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru',
      sub: ubah ? 'Perbarui nama dan peran akun.' : 'Buat akun baru untuk Admin / Petugas TU atau Kepala Sekolah.',
      aksi: `<button type="button" data-aksi="kembali" class="${KELAS.tombol}">Kembali</button>`,
    }) + `<form novalidate class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <div class="grid gap-5 sm:grid-cols-2">
        ${medan({ label: 'Nama Lengkap', nama: 'nama', nilai: nilai.nama, wajib: true, placeholder: 'Nama lengkap', atribut: { autocomplete: 'off' } })}
        ${medan({
          label: 'Username', nama: 'username', nilai: nilai.username, wajib: true, nonaktif: ubah,
          catatan: ubah ? 'Username tidak dapat diubah.' : '', placeholder: 'Contoh: petugas.tu',
          atribut: { autocapitalize: 'none', autocomplete: 'off', spellcheck: 'false' },
        })}
        ${ubah ? '' : medan({
          label: 'Password awal', nama: 'password', tipe: 'password', wajib: true, catatan: 'Minimal 8 karakter.',
          placeholder: 'Minimal 8 karakter', atribut: { autocomplete: 'new-password' },
        })}
        ${medan({ label: 'Peran Akun', nama: 'peran', nilai: nilai.peran, wajib: true, pilihan: PILIHAN_PERAN, placeholder: 'Pilih peran' })}
      </div>${barSimpan()}</form>`
    window.scrollTo(0, 0)
    pasangAksi(wadah, { kembali: () => tampilDaftar(false) })

    const form = wadah.querySelector('form')
    form.addEventListener('input', (e) => { if (e.target.name) bersihkanGalat(form, e.target.name) })
    form.addEventListener('change', (e) => { if (e.target.name) bersihkanGalat(form, e.target.name) })
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (form.querySelector('[data-simpan]').disabled) return
      const isian = bacaForm(form, ['nama', 'username', 'password', 'peran'])
      const galat = periksa(isian, ubah ? ATURAN_DASAR : ATURAN_BARU)
      if (Object.keys(galat).length) { tandaiGalat(form, galat); notif.kolomGalat(); return }
      sibukSimpan(form, true)
      try {
        await panggilApi('penggunaSimpan', { id: ubah ? u.id : '', ...isian })
        if (id !== layar || !wadah.isConnected) return
        tampilPesan({ jenis: 'sukses', teks: 'Data pengguna berhasil disimpan' })
        tampilDaftar(true)
      } catch (err) {
        if (id !== layar || !wadah.isConnected) return
        sibukSimpan(form, false)
        tampilPesan({ jenis: 'galat', teks: err.message })
      }
    })
    const pertama = form.querySelector('input:not(:disabled), select:not(:disabled)')
    if (pertama) pertama.focus()
  }

  tampilDaftar(true)
}
