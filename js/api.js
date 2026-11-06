// Satu-satunya tempat yang berbicara dengan backend GAS.
export function ambilToken() { return sessionStorage.getItem('token') }
export function simpanToken(token) { sessionStorage.setItem('token', token) }
export function hapusToken() { sessionStorage.removeItem('token') }

export async function panggilApi(aksi, data = {}) {
  const API_URL = window.APP_CONFIG && window.APP_CONFIG.API_URL
  if (!API_URL) {
    throw new Error('API_URL belum diisi di config.js')
  }

  let hasil
  try {
    const respons = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ aksi, token: ambilToken(), data }),
    })
    hasil = await respons.json()
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa URL dan deploy Web App.')
  }

  if (!hasil.ok) {
    if (hasil.kode === 'SESI_HABIS') {
      hapusToken()
      window.dispatchEvent(new Event('sesi-habis'))
    }
    throw new Error(hasil.pesan)
  }
  return hasil.data
}
