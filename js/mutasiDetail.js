import { panggilApi } from './api.js'
import { fileKeBase64, base64KeUrl } from './util.js'
import {
  esc, KELAS, memuat, judulHalaman, lencana, banner, galatMuat, isiUlang, pasangAksi,
  dialogKonfirmasi, dialogTanya, tampilPesan,
} from './ui.js'

const NAMA_AKSI = {
  MUTASI_TAMBAH: 'Dibuat',
  MUTASI_UBAH: 'Data diubah',
  MUTASI_AJUKAN: 'Diajukan',
  MUTASI_SETUJUI: 'Disetujui',
  MUTASI_TOLAK: 'Ditolak',
  MUTASI_BATAL_SETUJU: 'Persetujuan dibatalkan',
  LAMPIRAN_UNGGAH: 'Lampiran diunggah',
  LAMPIRAN_HAPUS: 'Lampiran dihapus',
}
const BATAS_RIWAYAT = 5
const TAB_ID = ['data', 'lampiran', 'riwayat']
const KOTAK_STATUS = {
  Ditolak: 'border-rose-200 bg-rose-50 text-rose-900',
  Diajukan: 'border-blue-200 bg-blue-50 text-blue-900',
  Disetujui: 'border-emerald-200 bg-emerald-50 text-emerald-900',
}

export function renderDetail(wadah, { id, hanyaBaca = false, bisaPutuskan = false, bisaBatalkan = false, onKembali, onUbah }) {
  const akar = document.createElement('div')
  akar.className = 'mut-detail'
  wadah.innerHTML = ''
  wadah.appendChild(akar)

  let detail = null
  let riwayat = []
  let catatan = ''
  let info = ''
  let sibuk = false
  let tab = 'data'
  let semuaRiwayat = false

  const tombolKembali = `<p class="mb-4"><button type="button" data-aksi="kembali" class="${KELAS.tombol}">&larr; Kembali ke daftar</button></p>`

  const ambil = async () => {
    const [d, r] = await Promise.all([panggilApi('mutasiDetail', { id }), panggilApi('mutasiRiwayat', { id })])
    if (!akar.isConnected) return false
    detail = d
    riwayat = r
    return true
  }

  async function muatAwal() {
    akar.innerHTML = tombolKembali + memuat()
    try {
      if (await ambil()) gambar()
    } catch (err) {
      if (akar.isConnected) akar.innerHTML = tombolKembali + galatMuat(err.message)
    }
  }

  async function segarkan() {
    try {
      if (await ambil()) gambar()
    } catch (err) {
      tampilPesan({ jenis: 'galat', teks: err.message })
    }
  }

  function setSibuk(b) {
    sibuk = b
    akar.querySelectorAll('[data-sibuk]').forEach((el) => { el.disabled = b })
    akar.querySelectorAll('[data-unggah]').forEach((el) => el.classList.toggle('pointer-events-none', b))
    akar.querySelectorAll('[data-unggah]').forEach((el) => el.classList.toggle('opacity-50', b))
  }

  function setInfo(teks) {
    info = teks
    const el = akar.querySelector('[data-pesan]')
    if (el) el.innerHTML = info ? banner({ teks: info }) : ''
  }

  const tombol = (aksi, teks, kelas = KELAS.tombol) =>
    `<button type="button" data-aksi="${aksi}" data-sibuk class="${kelas}"${sibuk ? ' disabled' : ''}>${esc(teks)}</button>`

  function kotakStatus(m) {
    const oleh = m.disetujui_oleh ? ' oleh ' + m.disetujui_oleh : ''
    const tgl = m.tanggal_persetujuan ? ' (' + m.tanggal_persetujuan + ')' : ''
    let judul = ''
    let baris = ''
    if (m.status === 'Ditolak') {
      judul = 'Ditolak' + oleh + tgl
      if (m.catatan_persetujuan) baris += `<p class="mt-1">Alasan: &ldquo;${esc(m.catatan_persetujuan)}&rdquo;</p>`
      if (!hanyaBaca) baris += '<p class="mt-1">Perbaiki data atau lampiran, lalu ajukan lagi.</p>'
    } else if (m.status === 'Diajukan') {
      judul = 'Menunggu keputusan Kepala Sekolah'
      if (m.diajukan_oleh) baris += `<p class="mt-1">Diajukan oleh ${esc(m.diajukan_oleh)} (${esc(m.tanggal_diajukan)})</p>`
    } else if (m.status === 'Disetujui') {
      judul = 'Disetujui' + oleh + tgl
      if (m.catatan_persetujuan) baris += `<p class="mt-1">Catatan: &ldquo;${esc(m.catatan_persetujuan)}&rdquo;</p>`
    } else {
      return ''
    }
    return `<div role="status" class="mb-5 rounded-2xl border p-4 text-sm font-medium ${KOTAK_STATUS[m.status]}"><strong class="font-bold text-base block">${esc(judul)}</strong>${baris}</div>`
  }

  function panelData(m) {
    const jk = m.jenis_kelamin === 'L' ? 'Laki-laki' : m.jenis_kelamin === 'P' ? 'Perempuan' : m.jenis_kelamin
    const kelompok = [
      ['Siswa', [
        ['Nama siswa', m.nama_siswa],
        ['NISN/NIS', m.nisn_nis || '-'],
        ['Jenis kelamin', jk],
        ['Tempat, tanggal lahir', (m.tempat_lahir || '-') + ', ' + (m.tanggal_lahir || '-')],
        ['Alamat', m.alamat],
      ]],
      ['Penempatan', [
        ['Kelas tujuan', m.nama_kelas],
        ['Tanggal masuk', m.tanggal],
      ]],
      ['Asal dan alasan pindah', [
        ['Sekolah asal', m.sekolah],
        ['Alasan', m.alasan],
        ['Catatan petugas', m.catatan || '-'],
      ]],
    ]
    return `<div role="tabpanel" id="panel-data" aria-labelledby="tab-data" class="grid gap-5 lg:grid-cols-3">${kelompok.map(([judul, baris]) =>
      `<section aria-label="${esc(judul)}" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 font-bold text-slate-900 border-b border-slate-100 pb-2">${esc(judul)}</h3>
        <dl class="grid gap-3.5 text-sm">${baris.map(([label, nilai]) =>
          `<div><dt class="text-xs font-semibold text-slate-400">${esc(label)}</dt><dd class="break-words font-semibold text-slate-800 mt-0.5">${esc(nilai)}</dd></div>`).join('')}</dl></section>`).join('')}</div>`
  }

  function panelLampiran(bisaUbah) {
    const { lampiran, wajib, maks_mb: maksMb } = detail
    const lengkap = wajib.filter((jd) => lampiran.some((l) => l.jenis_dokumen === jd)).length
    const daftar = wajib.concat(['Lainnya']).map((jd) => {
      const files = lampiran.filter((l) => l.jenis_dokumen === jd)
      const wajibIni = wajib.includes(jd)
      return `<li class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div class="mb-3 flex items-center justify-between gap-2"><span class="font-bold text-slate-900">${esc(jd)}</span>
            ${wajibIni ? lencana(files.length ? 'Disetujui' : 'Ditolak', files.length ? 'Lengkap' : 'Belum') : '<span class="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Opsional</span>'}</div>
          ${files.length === 0 ? '<p class="text-sm font-medium text-slate-400">Belum ada file terunggah</p>' : ''}
          ${files.map((l) => `<div class="flex items-center justify-between gap-2 py-1.5 text-sm border-t border-slate-100">
            <span class="min-w-0 truncate font-semibold text-slate-700" title="${esc(l.nama_file)}">${esc(l.nama_file)}</span>
            <span class="flex shrink-0 gap-1.5">
              <button type="button" data-aksi="lihat" data-id="${esc(l.id)}" class="${KELAS.tombol} ${KELAS.kecil}">Lihat File</button>
              ${bisaUbah ? `<button type="button" data-aksi="hapus-lampiran" data-id="${esc(l.id)}" data-sibuk class="${KELAS.tombol} ${KELAS.kecil} text-rose-600 hover:bg-rose-50 border-rose-200"${sibuk ? ' disabled' : ''}>Hapus</button>` : ''}
            </span></div>`).join('')}
        </div>
        ${bisaUbah ? `<label data-unggah class="${KELAS.tombol} ${KELAS.kecil} mt-4 cursor-pointer justify-center ${sibuk ? ' pointer-events-none opacity-50' : ''}">
          ${esc(files.length ? 'Unggah file lain' : 'Unggah ' + jd)}
          <input type="file" data-jenis="${esc(jd)}" class="sr-only" accept=".pdf,.jpg,.jpeg,.png" data-sibuk${sibuk ? ' disabled' : ''}></label>` : ''}</li>`
    }).join('')
    return `<div role="tabpanel" id="panel-lampiran" aria-labelledby="tab-lampiran">
      <p class="mb-4 text-sm font-medium text-slate-500"><strong class="text-slate-900 font-bold">${lengkap} dari ${wajib.length}</strong> dokumen wajib lengkap. Format PDF, JPG, atau PNG, maksimal ${esc(maksMb)} MB per file.</p>
      <ul class="grid gap-5 md:grid-cols-2">${daftar}</ul></div>`
  }

  function panelRiwayat(m) {
    if (riwayat.length === 0) return '<div role="tabpanel" id="panel-riwayat" aria-labelledby="tab-riwayat"><p class="text-sm font-medium text-slate-400">Belum ada riwayat aktivitas</p></div>'
    const urut = riwayat.slice().reverse()
    const tampil = semuaRiwayat ? urut : urut.slice(0, BATAS_RIWAYAT)
    const detailRiwayat = (r) => (r.detail && !r.detail.endsWith(m.nama_siswa) ? r.detail : '')
    return `<div role="tabpanel" id="panel-riwayat" aria-labelledby="tab-riwayat">
      <ol class="grid gap-4 border-l-2 border-slate-200 pl-5">${tampil.map((r) =>
        `<li class="text-sm"><strong class="block font-bold text-slate-900">${esc(NAMA_AKSI[r.aksi] || r.aksi)}</strong>
          <small class="block text-xs font-semibold text-slate-400 mt-0.5">${esc(r.waktu)} (WITA) &middot; ${esc(r.pengguna)}</small>
          ${detailRiwayat(r) ? `<span class="block text-slate-600 mt-1">${esc(detailRiwayat(r))}</span>` : ''}</li>`).join('')}</ol>
      ${urut.length > BATAS_RIWAYAT ? `<button type="button" data-aksi="semua-riwayat" class="${KELAS.tombol} ${KELAS.kecil} mt-4">${semuaRiwayat ? 'Tampilkan lebih sedikit' : 'Lihat semua (' + urut.length + ')'}</button>` : ''}</div>`
  }

  function gambar() {
    const { mutasi: m, lampiran, wajib, peringatan } = detail
    const bisaUbah = !hanyaBaca && (m.status === 'Draft' || m.status === 'Ditolak')
    const bisaHapus = !hanyaBaca && m.status !== 'Disetujui'
    const tampilPutusan = bisaPutuskan && m.status === 'Diajukan'
    const tampilBatal = bisaBatalkan && m.status === 'Disetujui'
    const lengkap = wajib.filter((jd) => lampiran.some((l) => l.jenis_dokumen === jd)).length

    const aksiJudul = [
      bisaUbah ? tombol('ubah', 'Ubah data') : '',
      bisaUbah ? tombol('ajukan', m.status === 'Ditolak' ? 'Ajukan ulang' : 'Ajukan ke Kepala Sekolah', KELAS.utama + ' mut-utama') : '',
      tampilBatal ? tombol('batalkan', 'Batalkan persetujuan', KELAS.bahaya) : '',
      bisaHapus ? `<details class="relative">
        <summary aria-label="Aksi lainnya" class="${KELAS.tombol} cursor-pointer list-none [&::-webkit-details-marker]:hidden">&#8943;</summary>
        <div class="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <button type="button" data-aksi="hapus-mutasi" data-sibuk class="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"${sibuk ? ' disabled' : ''}>Hapus permanen</button></div></details>` : '',
    ].join('')

    const tabs = [
      { id: 'data', label: 'Data Siswa' },
      { id: 'lampiran', label: 'Lampiran Berkas', badge: lengkap + '/' + wajib.length, kurang: lengkap < wajib.length },
      { id: 'riwayat', label: 'Riwayat Log', badge: String(riwayat.length) },
    ]
    const barTab = `<div role="tablist" aria-label="Bagian detail" class="mut-tabs mb-6 flex gap-2 overflow-x-auto border-b border-slate-200">${tabs.map((t) =>
      `<button type="button" role="tab" id="tab-${t.id}" data-aksi="tab" data-id="${t.id}" aria-selected="${tab === t.id}" aria-controls="panel-${t.id}" tabindex="${tab === t.id ? 0 : -1}"
        class="-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-bold transition-all ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'}">${esc(t.label)}${t.badge
          ? `<span class="rounded-full px-2.5 py-0.5 text-xs font-bold ${t.kurang ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}">${esc(t.badge)}</span>` : ''}</button>`).join('')}</div>`

    const putusan = tampilPutusan ? `<section aria-labelledby="mut-putusan" class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 id="mut-putusan" class="mb-3 text-lg font-bold text-slate-900">Form Keputusan Kepala Sekolah</h3>
      <label class="block text-sm font-semibold text-slate-800">Catatan (wajib diisi jika menolak)
        <textarea name="catatan" rows="3" class="${KELAS.input} mt-1.5 font-normal">${esc(catatan)}</textarea></label>
      <div class="mut-putusan-aksi mt-4 flex gap-3">${tombol('setujui', 'Setujui Pengajuan', KELAS.utama)}${tombol('tolak', 'Tolak Pengajuan', KELAS.bahaya)}</div></section>` : ''

    isiUlang(akar, tombolKembali
      + judulHalaman({
        judul: 'Detail Siswa Masuk',
        subHtml: `<span class="text-slate-900 font-bold text-lg">${esc(m.nama_siswa)}</span> &middot; ${lencana(m.status)}`,
        aksi: aksiJudul,
        kelasAksi: 'mut-aksi',
      })
      + `<div data-pesan>${info ? banner({ teks: info }) : ''}</div>`
      + (peringatan ? `<p role="alert" class="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">${esc(peringatan)}</p>` : '')
      + kotakStatus(m)
      + putusan
      + barTab
      + (tab === 'data' ? panelData(m) : tab === 'lampiran' ? panelLampiran(bisaUbah) : panelRiwayat(m)))
  }

  async function jalankan(kerja) {
    setSibuk(true)
    try {
      await kerja()
    } catch (err) {
      tampilPesan({ jenis: 'galat', teks: err.message })
    } finally {
      if (akar.isConnected) setSibuk(false)
    }
  }

  async function unggah(jenisDokumen, input) {
    const file = input.files[0]
    input.value = ''
    if (!file) return
    const { mutasi: m, maks_mb: maksMb } = detail
    if (file.size > maksMb * 1024 * 1024) {
      tampilPesan({ jenis: 'galat', teks: 'Ukuran file melebihi ' + maksMb + ' MB' })
      return
    }
    setSibuk(true)
    setInfo('Mengunggah ' + file.name + '...')
    try {
      const base64 = await fileKeBase64(file)
      await panggilApi('lampiranUnggah', { mutasi_id: m.id, jenis_dokumen: jenisDokumen, nama_file: file.name, base64 })
      setInfo('')
      tampilPesan({ jenis: 'sukses', teks: 'Lampiran terunggah' })
      await segarkan()
    } catch (err) {
      setInfo('')
      tampilPesan({ jenis: 'galat', teks: err.message })
    } finally {
      if (akar.isConnected) setSibuk(false)
    }
  }

  async function lihat(idLampiran) {
    const tabBaru = window.open('', '_blank')
    try {
      const data = await panggilApi('lampiranAmbil', { id: idLampiran })
      const url = base64KeUrl(data.mime, data.base64)
      if (tabBaru) tabBaru.location.href = url
    } catch (err) {
      if (tabBaru) tabBaru.close()
      tampilPesan({ jenis: 'galat', teks: err.message })
    }
  }

  async function hapusLampiran(idLampiran) {
    const l = detail.lampiran.find((x) => String(x.id) === String(idLampiran))
    if (!l) return
    const ya = await dialogKonfirmasi({ judul: 'Hapus lampiran?', pesan: l.nama_file, ya: 'Hapus', bahaya: true })
    if (!ya || !akar.isConnected) return
    try {
      await panggilApi('lampiranHapus', { id: l.id })
      await segarkan()
    } catch (err) {
      tampilPesan({ jenis: 'galat', teks: err.message })
    }
  }

  async function ajukan() {
    const ya = await dialogKonfirmasi({
      judul: 'Ajukan ke Kepala Sekolah?',
      pesan: 'Mutasi ini akan dikirim untuk diputuskan Kepala Sekolah.',
      ya: 'Ajukan',
    })
    if (!ya || !akar.isConnected) return
    await jalankan(async () => {
      const hasil = await panggilApi('mutasiAjukan', { id: detail.mutasi.id })
      tampilPesan({ jenis: 'sukses', teks: 'Mutasi diajukan.' + (hasil.peringatan ? ' ' + hasil.peringatan : '') })
      await segarkan()
    })
  }

  async function hapusMutasi() {
    const ya = await dialogKonfirmasi({
      judul: 'Hapus permanen?',
      pesan: 'Mutasi ini beserta lampirannya akan dihapus permanen. Data tidak dapat dikembalikan.',
      ya: 'Hapus permanen',
      bahaya: true,
    })
    if (!ya || !akar.isConnected) return
    try {
      await panggilApi('mutasiHapus', { id: detail.mutasi.id })
      onKembali()
    } catch (err) {
      tampilPesan({ jenis: 'galat', teks: err.message })
    }
  }

  async function setujui() {
    const ya = await dialogKonfirmasi({
      judul: 'Setujui mutasi?',
      pesan: 'Siswa akan terdaftar aktif di ' + detail.mutasi.nama_kelas + ' dan kuota kelas diperbarui.',
      ya: 'Setujui',
    })
    if (!ya || !akar.isConnected) return
    await jalankan(async () => {
      const hasil = await panggilApi('mutasiSetujui', { id: detail.mutasi.id, catatan })
      tampilPesan({ jenis: 'sukses', teks: 'Mutasi disetujui.' + (hasil.peringatan ? ' ' + hasil.peringatan : '') })
      catatan = ''
      await segarkan()
    })
  }

  async function tolak() {
    if (!catatan.trim()) {
      tampilPesan({ jenis: 'galat', teks: 'Catatan wajib diisi jika menolak' })
      return
    }
    const ya = await dialogKonfirmasi({
      judul: 'Tolak pengajuan?',
      pesan: 'Pengajuan akan dikembalikan ke petugas TU dengan catatan Anda.',
      ya: 'Tolak',
      bahaya: true,
    })
    if (!ya || !akar.isConnected) return
    await jalankan(async () => {
      await panggilApi('mutasiTolak', { id: detail.mutasi.id, catatan })
      tampilPesan({ jenis: 'sukses', teks: 'Pengajuan ditolak' })
      catatan = ''
      await segarkan()
    })
  }

  async function batalkan() {
    const alasan = await dialogTanya({
      judul: 'Batalkan persetujuan?',
      pesan: 'Siswa yang dibuat dari mutasi ini akan dihapus dan mutasi kembali ke Draft.',
      label: 'Alasan pembatalan',
      ya: 'Batalkan persetujuan',
      bahaya: true,
    })
    if (!alasan || !alasan.trim() || !akar.isConnected) return
    await jalankan(async () => {
      const hasil = await panggilApi('mutasiBatalSetuju', { id: detail.mutasi.id, alasan })
      tampilPesan({ jenis: 'sukses', teks: hasil.pesan })
      await segarkan()
    })
  }

  const tutupMenu = (el) => { const d = el && el.closest('details'); if (d) d.open = false }

  pasangAksi(akar, {
    kembali: () => onKembali(),
    'muat-ulang': muatAwal,
    ubah: () => onUbah(),
    ajukan,
    batalkan,
    setujui,
    tolak,
    lihat,
    'hapus-lampiran': hapusLampiran,
    'hapus-mutasi': (_, el) => { tutupMenu(el); hapusMutasi() },
    tab: (idTab) => { tab = idTab; gambar() },
    'semua-riwayat': () => { semuaRiwayat = !semuaRiwayat; gambar() },
  })
  akar.addEventListener('input', (e) => { if (e.target.name === 'catatan') catatan = e.target.value })
  akar.addEventListener('keydown', (e) => {
    if (!e.target.closest || !e.target.closest('[role="tab"]')) return
    const i = TAB_ID.indexOf(tab)
    let baru = ''
    if (e.key === 'ArrowRight') baru = TAB_ID[(i + 1) % TAB_ID.length]
    else if (e.key === 'ArrowLeft') baru = TAB_ID[(i + TAB_ID.length - 1) % TAB_ID.length]
    else if (e.key === 'Home') baru = TAB_ID[0]
    else if (e.key === 'End') baru = TAB_ID[TAB_ID.length - 1]
    if (!baru) return
    e.preventDefault()
    tab = baru
    gambar()
    const el = akar.querySelector('#tab-' + baru)
    if (el) el.focus()
  })
  akar.addEventListener('change', (e) => {
    if (e.target.matches('input[type="file"][data-jenis]')) unggah(e.target.dataset.jenis, e.target)
  })

  muatAwal()
}
