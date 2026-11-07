// Satu-satunya tempat yang berbicara dengan backend GAS.
export function ambilToken() { return sessionStorage.getItem('token') }
export function simpanToken(token) { sessionStorage.setItem('token', token) }
export function hapusToken() { sessionStorage.removeItem('token') }

const TIMEOUT_MS = 45000 // GAS yang baru "bangun" bisa lambat; lebih dari ini dianggap gagal
const TTL_KELAS_MS = 60000

// Aksi yang hanya membaca: aman diulang otomatis. Aksi lain (tulis) tidak pernah diulang.
const AKSI_BACA = new Set([
  'me', 'kelasDaftar', 'siswaDaftar', 'mutasiDaftar', 'mutasiDetail', 'mutasiRiwayat',
  'dashboard', 'laporanRekap', 'logDaftar', 'pengaturanAmbil', 'penggunaDaftar', 'lampiranAmbil',
  'profilFotoAmbil',
])

// Daftar kelas dipakai banyak halaman (filter, form). Simpan sebentar; dibuang saat ada aksi tulis.
let cacheKelas = null

async function kirim(url, aksi, data) {
  const pengendali = new AbortController()
  const batas = setTimeout(() => pengendali.abort(), TIMEOUT_MS)
  try {
    const respons = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ aksi, token: ambilToken(), data }),
      signal: pengendali.signal,
    })
    return await respons.json()
  } finally {
    clearTimeout(batas)
  }
}

export async function panggilApi(aksi, data = {}) {
  const API_URL = window.APP_CONFIG && window.APP_CONFIG.API_URL
  if (!API_URL) {
    throw new Error('API_URL belum diisi di config.js')
  }

  const baca = AKSI_BACA.has(aksi)
  const bisaCache = aksi === 'kelasDaftar' && Object.keys(data).length === 0
  if (!baca) cacheKelas = null
  if (bisaCache && cacheKelas && Date.now() - cacheKelas.waktu < TTL_KELAS_MS) {
    return JSON.parse(cacheKelas.isi)
  }

  let hasil
  for (let percobaan = 0; ; percobaan++) {
    try {
      hasil = await kirim(API_URL, aksi, data)
      break
    } catch {
      if (!baca || percobaan >= 1) {
        throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet, lalu coba lagi.')
      }
    }
  }

  if (!hasil.ok) {
    if (hasil.kode === 'SESI_HABIS') {
      hapusToken()
      window.dispatchEvent(new Event('sesi-habis'))
    }
    throw new Error(hasil.pesan)
  }
  if (!baca) cacheKelas = null
  if (bisaCache) cacheKelas = { waktu: Date.now(), isi: JSON.stringify(hasil.data) }
  return hasil.data
}