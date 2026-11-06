import { esc, KELAS } from './ui.js'

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function filterAwal() {
  const sekarang = new Date()
  return {
    mode: 'tahun',
    tahun_ajaran: '',
    semester: '1',
    bulanNo: String(sekarang.getMonth() + 1),
    tahunBulan: String(sekarang.getFullYear()),
  }
}

export function parameterPeriode(f) {
  return {
    mode: f.mode,
    tahun_ajaran: f.tahun_ajaran,
    semester: f.semester,
    bulan: f.tahunBulan + '-' + f.bulanNo.padStart(2, '0'),
  }
}

const opsi = (nilai, label, pilih) => `<option value="${esc(nilai)}"${String(nilai) === String(pilih) ? ' selected' : ''}>${esc(label)}</option>`

export function formPeriode(f, daftarTA = []) {
  const sel = KELAS.kontrol
  return `<form class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm print:hidden">
    <div class="flex flex-wrap items-center gap-3 flex-1">
      <select name="mode" aria-label="Jenis periode" class="${sel}">${opsi('tahun', 'Tahun ajaran', f.mode)}${opsi('semester', 'Semester', f.mode)}${opsi('bulan', 'Bulan', f.mode)}</select>
      ${f.mode !== 'bulan' ? `<select name="tahun_ajaran" aria-label="Tahun ajaran" class="${sel}">${daftarTA.map((t) => opsi(t, t, f.tahun_ajaran)).join('')}</select>` : ''}
      ${f.mode === 'semester' ? `<select name="semester" aria-label="Semester" class="${sel}">${opsi('1', 'Semester 1 (Jul-Des)', f.semester)}${opsi('2', 'Semester 2 (Jan-Jun)', f.semester)}</select>` : ''}
      ${f.mode === 'bulan' ? `<select name="bulanNo" aria-label="Bulan" class="${sel}">${NAMA_BULAN.map((b, i) => opsi(String(i + 1), b, f.bulanNo)).join('')}</select>
        <input name="tahunBulan" type="number" value="${esc(f.tahunBulan)}" aria-label="Tahun" class="${sel} w-28">` : ''}
    </div>
    <button type="submit" class="${KELAS.utama}">Tampilkan Data</button></form>`
}

export function pengendaliPeriode(wadah, saatTampil) {
  const s = { filter: filterAwal(), daftarTA: [] }
  function gambar(fokus) {
    wadah.innerHTML = formPeriode(s.filter, s.daftarTA)
    if (fokus) { const el = wadah.querySelector(`[name="${fokus}"]`); if (el) el.focus() }
  }
  function baca() {
    const form = wadah.querySelector('form')
    if (!form) return
    for (const el of form.elements) if (el.name && el.name in s.filter) s.filter[el.name] = el.value
  }
  wadah.addEventListener('change', (e) => {
    baca()
    if (e.target.name === 'mode') gambar('mode')
  })
  wadah.addEventListener('submit', (e) => { e.preventDefault(); baca(); saatTampil(s.filter) })
  return {
    s,
    gambar,
    setDaftar(daftarTA, tahunAjaran) {
      s.daftarTA = daftarTA
      if (tahunAjaran) s.filter.tahun_ajaran = tahunAjaran
      gambar()
    },
  }
}
