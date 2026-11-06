import { panggilApi } from '../api.js'
import { esc, KELAS, IKON, memuat, judulHalaman, lencana, tabel, galatMuat, pasangAksi } from '../ui.js'
import { formFilterMutasi, pasangFilter, opsiKelas } from '../mutasiFilter.js'
import { renderDetail } from '../mutasiDetail.js'

const OPSI_STATUS = [
  { nilai: 'Diajukan', label: 'Menunggu persetujuan' },
  { nilai: 'Disetujui', label: 'Disetujui' },
  { nilai: 'Ditolak', label: 'Ditolak' },
]

export function render(wadah) {
  const filter = { q: '', status: 'Diajukan', kelas_id: '', dari: '', sampai: '' }
  let kelas = []
  let kelasAda = false
  let urutan = 0

  function buka(id) {
    renderDetail(wadah, { id, hanyaBaca: true, bisaPutuskan: true, onKembali: tampilDaftar })
    window.scrollTo(0, 0)
  }

  function gambarIsi(akar, hasil) {
    akar.querySelector('[data-isi]').innerHTML = `<p class="mb-3 text-sm font-semibold text-slate-500">Jumlah Pengajuan: <strong class="text-slate-900">${esc(hasil.total)}</strong></p>`
      + tabel({
        kolom: [
          { judul: 'Nama Siswa', html: (m) => `<strong class="text-slate-900 font-bold">${esc(m.nama_siswa)}</strong>` },
          { judul: 'Kelas Tujuan', nilai: (m) => m.nama_kelas },
          { judul: 'Tanggal Masuk', nilai: (m) => m.tanggal },
          { judul: 'Sekolah Asal', nilai: (m) => m.sekolah },
          { judul: 'Diajukan Oleh', nilai: (m) => m.diajukan_oleh || '-' },
          { judul: 'Status', di: 'tanda', html: (m) => lencana(m.status) },
          { judul: 'Aksi', rata: 'tengah', di: 'aksi', html: (m) => `<button type="button" data-aksi="buka" data-id="${esc(m.id)}" class="${KELAS.utama} ${KELAS.kecil}">Tinjau Pengajuan</button>` },
        ],
        baris: hasil.daftar,
        kosong: { ikon: IKON.info, judul: 'Tidak ada pengajuan persetujuan' },
      })
  }

  async function muatIsi(akar) {
    const saya = ++urutan
    const isi = akar.querySelector('[data-isi]')
    isi.innerHTML = memuat()
    try {
      const hasil = await panggilApi('mutasiDaftar', filter)
      if (saya !== urutan || !akar.isConnected) return
      gambarIsi(akar, hasil)
    } catch (err) {
      if (saya !== urutan || !akar.isConnected) return
      isi.innerHTML = galatMuat(err.message)
    }
  }

  function tampilDaftar() {
    const akar = document.createElement('div')
    wadah.innerHTML = ''
    wadah.appendChild(akar)
    akar.innerHTML = judulHalaman({ judul: 'Persetujuan Siswa Masuk', sub: 'Tinjau berkas pengajuan mutasi siswa, lalu setujui atau tolak.' })
      + formFilterMutasi(filter, kelas, OPSI_STATUS) + '<div data-isi></div>'
    pasangAksi(akar, { buka, 'muat-ulang': () => muatIsi(akar) })
    pasangFilter(akar.querySelector('[data-filter]'), filter, () => muatIsi(akar))
    muatIsi(akar)

    if (!kelasAda) {
      panggilApi('kelasDaftar').then((k) => {
        kelas = k
        kelasAda = true
        const sel = akar.isConnected && akar.querySelector('[name="kelas_id"]')
        if (sel) sel.innerHTML = opsiKelas(kelas, filter.kelas_id)
      }).catch(() => {})
    }
    window.scrollTo(0, 0)
  }

  tampilDaftar()
}
