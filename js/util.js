export function fileKeBase64(file) {
  return new Promise((resolve, reject) => {
    const pembaca = new FileReader()
    pembaca.onload = () => resolve(String(pembaca.result).split(',')[1])
    pembaca.onerror = () => reject(new Error('Gagal membaca file'))
    pembaca.readAsDataURL(file)
  })
}

export function base64KeUrl(mime, base64) {
  const biner = atob(base64)
  const larik = new Uint8Array(biner.length)
  for (let i = 0; i < biner.length; i++) larik[i] = biner.charCodeAt(i)
  return URL.createObjectURL(new Blob([larik], { type: mime }))
}

export function persen(bagian, total) {
  if (!total || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((bagian / total) * 100)))
}
