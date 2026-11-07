import { panggilApi } from './api.js'
import {
  KELAS, memuat, judulHalaman, medan, bacaForm, barSimpan, sibukSimpan, galatMuat, pasangAksi, tampilPesan,
} from './ui.js'

const KOLOM = ['nama_siswa', 'nisn_nis', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'kelas_id', 'tanggal', 'sekolah', 'alamat', 'alasan', 'catatan']
const TEKS_SIMPAN = 'Simpan sebagai Draft'

export function renderForm(wadah, { id = '', onSelesai }) {
  const akar = document.createElement('div')
  wadah.innerHTML = ''
  wadah.appendChild(akar)

  const judul = (ubah) => judulHalaman({
    judul: (ubah ? 'Ubah' : 'Tambah') + ' Siswa Masuk',
    sub: 'Lampiran berkas dapat diunggah setelah data berhasil disimpan.',
    aksi: `<button type="button" data-aksi="kembali" class="${KELAS.tombol}">Batal</button>`,
  })

  async function muat() {
    akar.innerHTML = judul(Boolean(id)) + memuat()
    try {
      const [kelas, detail] = await Promise.all([
        panggilApi('kelasDaftar'),
        id ? panggilApi('mutasiDetail', { id }) : Promise.resolve(null),
      ])
      if (!akar.isConnected) return
      gambar(kelas, detail ? detail.mutasi : null)
    } catch (err) {
      if (!akar.isConnected) return
      akar.innerHTML = judul(Boolean(id)) + galatMuat(err.message)
    }
  }

  function gambar(kelas, m) {
    const n = m
      ? {
        nama_siswa: m.nama_siswa, nisn_nis: m.nisn_nis || '', jenis_kelamin: m.jenis_kelamin,
        tempat_lahir: m.tempat_lahir || '', tanggal_lahir: m.tanggal_lahir || '', kelas_id: m.kelas_id,
        tanggal: m.tanggal, sekolah: m.sekolah, alamat: m.alamat, alasan: m.alasan, catatan: m.catatan || '',
      }
      : {
        nama_siswa: '', nisn_nis: '', jenis_kelamin: 'L', tempat_lahir: '', tanggal_lahir: '', kelas_id: '',
        tanggal: '', sekolah: '', alamat: '', alasan: '', catatan: '',
      }
    const seksi = (judulSeksi, isi) => `<fieldset class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <legend class="px-3 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg py-1">${judulSeksi}</legend><div class="mt-4 grid gap-5 sm:grid-cols-2">${isi}</div></fieldset>`
    const kelasPilihan = [{ nilai: '', label: '(pilih kelas)' }]
      .concat(kelas.map((k) => ({ nilai: k.id, label: k.nama_kelas + ' - ' + k.tahun_ajaran + ' (sisa ' + k.sisa + ')' })))

    akar.innerHTML = judul(Boolean(m)) + `<form novalidate>
      ${seksi('1. Data Pribadi Siswa', `
        ${medan({ label: 'Nama lengkap siswa', nama: 'nama_siswa', nilai: n.nama_siswa, penuh: true })}
        ${medan({ label: 'NISN / NIS (jika ada)', nama: 'nisn_nis', nilai: n.nisn_nis, atribut: { inputmode: 'numeric' } })}
        ${medan({ label: 'Jenis kelamin', nama: 'jenis_kelamin', nilai: n.jenis_kelamin, pilihan: [{ nilai: 'L', label: 'Laki-laki' }, { nilai: 'P', label: 'Perempuan' }] })}
        ${medan({ label: 'Tempat lahir', nama: 'tempat_lahir', nilai: n.tempat_lahir })}
        ${medan({ label: 'Tanggal lahir', nama: 'tanggal_lahir', nilai: n.tanggal_lahir, tipe: 'date' })}
        ${medan({ label: 'Alamat siswa', nama: 'alamat', nilai: n.alamat, penuh: true })}`)}
      ${seksi('2. Penempatan Kelas', `
        ${medan({ label: 'Kelas tujuan', nama: 'kelas_id', nilai: n.kelas_id, pilihan: kelasPilihan })}
        ${medan({ label: 'Tanggal masuk', nama: 'tanggal', nilai: n.tanggal, tipe: 'date' })}`)}
      ${seksi('3. Asal dan Alasan Pindah', `
        ${medan({ label: 'Sekolah asal', nama: 'sekolah', nilai: n.sekolah })}
        ${medan({ label: 'Alasan pindah', nama: 'alasan', nilai: n.alasan })}
        ${medan({ label: 'Catatan (boleh kosong)', nama: 'catatan', nilai: n.catatan, penuh: true })}`)}
      ${barSimpan({ teks: TEKS_SIMPAN })}</form>`
    window.scrollTo(0, 0)

    const form = akar.querySelector('form')
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (form.querySelector('[data-simpan]').disabled) return
      sibukSimpan(form, true, TEKS_SIMPAN)
      try {
        const hasil = await panggilApi('mutasiSimpan', { id: m ? m.id : id, ...bacaForm(form, KOLOM) })
        tampilPesan({ jenis: 'sukses', teks: id ? 'Data siswa masuk berhasil diperbarui' : 'Siswa masuk berhasil ditambahkan sebagai Draft' })
        if (!akar.isConnected) return
        onSelesai(hasil.id)
      } catch (err) {
        if (!akar.isConnected) return
        sibukSimpan(form, false, TEKS_SIMPAN)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        tampilPesan({ jenis: 'galat', teks: err.message })
      }
    })
    const pertama = form.querySelector('input:not(:disabled)')
    if (pertama) pertama.focus()
  }

  pasangAksi(akar, { kembali: () => onSelesai(''), 'muat-ulang': muat })
  muat()
}