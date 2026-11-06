import { panggilApi, simpanToken } from '../api.js'
import { ikon } from '../ui.js'

const IK_ORANG = 'M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7'
const IK_GEMBOK = 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3'
const MATA_BUKA = '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>'
const MATA_TUTUP = '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>'

const KELAS_INPUT = 'w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 transition-all focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400'

export function render(wadah, onBerhasil) {
  wadah.innerHTML = `
    <div class="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-2xl md:grid-cols-[1.1fr_1.2fr]">
      <div class="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 md:flex flex-col justify-between border-r border-slate-800 relative overflow-hidden">
        <div class="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="flex items-center gap-3.5 text-white z-10">
          <div class="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 grid place-items-center shrink-0">
            <img src="assets/logo-sekolah.png" alt="Logo sekolah" width="48" height="48" class="h-9 w-9 object-contain" onerror="this.src='assets/favicon.svg'">
          </div>
          <div class="leading-tight"><strong class="block text-xl font-bold tracking-tight">SMP Negeri 1</strong><span class="block text-sm font-medium text-slate-400">Tapa</span></div>
        </div>
        <div class="z-10 my-auto">
          <span class="inline-block rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 mb-4">Sistem Resmi</span>
          <h2 class="text-3xl font-extrabold text-white tracking-tight leading-tight">Sistem Informasi Mutasi Siswa</h2>
          <p class="mt-3 text-sm text-slate-400 leading-relaxed">Kelola pendaftaran, seleksi, serta rekapitulasi siswa pindahan secara terpadu, cepat, dan akurat.</p>
        </div>
        <p class="text-xs text-slate-500 font-medium z-10">&copy; 2026 SMP Negeri 1 Tapa. All rights reserved.</p>
      </div>
      <div class="p-8 sm:p-12 flex flex-col justify-center">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang!</h1>
          <p class="mt-2 text-sm text-slate-500 font-medium">Masukkan akun Anda untuk melanjutkan ke aplikasi SIM Mutasi Siswa.</p>
        </div>
        <form id="form-login" class="grid gap-4" novalidate>
          <label class="relative block">
            <span class="sr-only">Username</span>
            <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">${ikon(IK_ORANG, 'h-5 w-5')}</span>
            <input name="username" class="${KELAS_INPUT}" autocomplete="username" placeholder="Masukkan username" autocapitalize="none" spellcheck="false">
          </label>
          <label class="relative block">
            <span class="sr-only">Password</span>
            <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">${ikon(IK_GEMBOK, 'h-5 w-5')}</span>
            <input name="password" type="password" class="${KELAS_INPUT} pr-12" autocomplete="current-password" placeholder="Masukkan password">
            <button type="button" id="lihat" aria-label="Tampilkan password" aria-pressed="false" class="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors">${MATA_BUKA}</button>
          </label>
          <p id="galat" role="alert" class="hidden rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"></p>
          <button type="submit" id="kirim" class="mt-2 min-h-[2.875rem] rounded-xl bg-blue-600 px-5 font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60">Masuk Aplikasi</button>
        </form>
      </div>
    </div>`

  const form = wadah.querySelector('#form-login')
  const inUser = form.elements.username
  const inPass = form.elements.password
  const tombolLihat = wadah.querySelector('#lihat')
  const kotakGalat = wadah.querySelector('#galat')
  const tombolKirim = wadah.querySelector('#kirim')

  function tampilGalat(teks) {
    kotakGalat.textContent = teks
    kotakGalat.classList.toggle('hidden', !teks)
  }

  tombolLihat.addEventListener('click', () => {
    const tampak = inPass.type === 'password'
    inPass.type = tampak ? 'text' : 'password'
    tombolLihat.innerHTML = tampak ? MATA_TUTUP : MATA_BUKA
    tombolLihat.setAttribute('aria-pressed', String(tampak))
    tombolLihat.setAttribute('aria-label', tampak ? 'Sembunyikan password' : 'Tampilkan password')
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    tampilGalat('')
    tombolKirim.disabled = true
    tombolKirim.textContent = 'Memproses...'
    try {
      const hasil = await panggilApi('login', { username: inUser.value, password: inPass.value })
      simpanToken(hasil.token)
      onBerhasil(hasil.pengguna)
    } catch (err) {
      tampilGalat(err.message)
    } finally {
      tombolKirim.disabled = false
      tombolKirim.textContent = 'Masuk Aplikasi'
    }
  })

  inUser.focus()
}
