// Log kecil di layar buat nyari bug yang cuma kejadian di HP. Nyalain dengan
// buka app pakai ?debug=1 di alamatnya (ke-simpen di HP itu), matiin dengan
// ?debug=0. Kalau gak nyala, catat() gak ngapa-ngapain.
function bacaAktif() {
  try {
    const q = new URLSearchParams(window.location.search).get('debug')
    if (q === '1') localStorage.setItem('goyan-debug', '1')
    if (q === '0') localStorage.removeItem('goyan-debug')
    return localStorage.getItem('goyan-debug') === '1'
  } catch {
    return false
  }
}

export const debugAktif = bacaAktif()

const baris = []
const pendengar = new Set()

export function catat(...bagian) {
  if (!debugAktif) return
  const d = new Date()
  const jam = `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, '0')}`
  baris.push(`${jam} ${bagian.join(' ')}`)
  if (baris.length > 80) baris.shift()
  pendengar.forEach((f) => f())
}

export function ambilBaris() {
  return baris.slice()
}

export function dengarkan(f) {
  pendengar.add(f)
  return () => pendengar.delete(f)
}
