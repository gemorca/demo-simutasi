import { esc, KELAS } from './ui.js'

export function opsiKelas(kelas, nilai) {
  return '<option value="">Semua kelas</option>' + kelas.map((k) =>
    `<option value="${esc(k.id)}"${String(k.id) === String(nilai) ? ' selected' : ''}>${esc(k.nama_kelas + ' - ' + k.tahun_ajaran)}</option>`).join('')
}

const jumlahAktif = (filter) => ['kelas_id', 'status', 'dari', 'sampai'].filter((n) => filter[n]).length

export function formFilterMutasi(filter, kelas, opsiStatus) {
  const lab = 'grid gap-1.5 text-sm font-semibold text-slate-800'
  const lain = lab + ' flt-lain'
  const aktif = jumlahAktif(filter)
  const isi = `${KELAS.kontrol} font-normal`
  return `<form data-filter role="search" class="flt-tutup mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
    <label class="${lab} flt-cari min-w-[12rem] flex-1">Cari Data
      <input name="q" value="${esc(filter.q)}" placeholder="Nama siswa atau sekolah asal" autocomplete="off" class="${isi}"></label>
    <button type="button" data-flt-toggle aria-expanded="false" class="${KELAS.tombol} flt-toggle">Filter Advanced
      <span data-flt-jumlah class="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-bold"${aktif ? '' : ' hidden'}>${aktif}</span></button>
    <label class="${lain}">Filter Kelas
      <select name="kelas_id" class="${isi}">${opsiKelas(kelas, filter.kelas_id)}</select></label>
    <label class="${lain}">Status Mutasi
      <select name="status" class="${isi}">${opsiStatus.map((o) =>
        `<option value="${esc(o.nilai)}"${o.nilai === filter.status ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>
    <label class="${lain}">Dari Tanggal
      <input name="dari" type="date" value="${esc(filter.dari)}" class="${isi}"></label>
    <label class="${lain}">Sampai Tanggal
      <input name="sampai" type="date" value="${esc(filter.sampai)}" class="${isi}"></label>
    <button type="submit" class="${KELAS.utama}">Terapkan Filter</button></form>`
}

export function pasangFilter(form, filter, onCari) {
  const tandai = () => {
    const el = form.querySelector('[data-flt-jumlah]')
    if (!el) return
    const n = jumlahAktif(filter)
    el.textContent = n
    el.hidden = n === 0
  }
  const baca = () => { for (const n of Object.keys(filter)) if (form.elements[n]) filter[n] = form.elements[n].value; tandai() }
  form.addEventListener('input', baca)
  form.addEventListener('change', baca)
  form.addEventListener('submit', (e) => { e.preventDefault(); baca(); onCari() })
  form.addEventListener('click', (e) => {
    const t = e.target.closest('[data-flt-toggle]')
    if (!t) return
    const tutup = form.classList.toggle('flt-tutup')
    t.setAttribute('aria-expanded', String(!tutup))
  })
}
