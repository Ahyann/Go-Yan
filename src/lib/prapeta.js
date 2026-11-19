// Mulai mengunduh gambar peta untuk posisi terakhir SEBELUM aplikasi selesai dimuat. Selama ini peta baru mulai
// meminta gambar setelah JavaScript, login Firebase, dan data permintaan selesai, jadi unduhan gambar menunggu
// di belakang semuanya. Dengan permintaan lebih awal, waktu itu dipakai untuk mengunduh, dan saat peta
// terpasang gambarnya sudah ada di cache browser (alamatnya harus sama persis dengan yang dipakai Leaflet).
import { ambilPetaTerakhir } from './petaTerakhir'

const PUSAT_DEFAULT = [-6.2088, 106.8456]
const KUNCI = [
  { kunci: 'go-yan-peta-terakhir-penumpang', zoom: 15 },
  { kunci: 'go-yan-peta-terakhir-ojek', zoom: 13 },
]
const UKURAN_KOTAK = 256

function koordinatKotak(lat, lng, zoom) {
  const n = 2 ** zoom
  const x = ((lng + 180) / 360) * n
  const y = ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n
  return { x, y, n }
}

export function muatPetaLebihAwal() {
  const kunciApi = import.meta.env.VITE_MAPTILER_KEY
  if (!kunciApi || typeof window === 'undefined') return
  const lebar = window.innerWidth || 400
  const tinggi = window.innerHeight || 800
  // pakai posisi tersimpan yang ada; kalau belum ada sama sekali, posisi awal penumpang
  const tersimpan = KUNCI.filter(({ kunci }) => {
    try { return localStorage.getItem(kunci) } catch { return false }
  })
  const daftar = tersimpan.length ? tersimpan : [KUNCI[0]]
  const dimuat = new Set()
  window.__prapeta = []
  for (const { kunci, zoom: zoomAwal } of daftar) {
    const { center, zoom } = ambilPetaTerakhir(kunci, PUSAT_DEFAULT, zoomAwal)
    const z = Math.max(0, Math.min(20, Math.round(zoom)))
    const { x, y, n } = koordinatKotak(center[0], center[1], z)
    const kiri = Math.floor(x - lebar / 2 / UKURAN_KOTAK)
    const kanan = Math.floor(x + lebar / 2 / UKURAN_KOTAK)
    const atas = Math.floor(y - tinggi / 2 / UKURAN_KOTAK)
    const bawah = Math.floor(y + tinggi / 2 / UKURAN_KOTAK)
    for (let tx = kiri; tx <= kanan; tx++) {
      for (let ty = atas; ty <= bawah; ty++) {
        if (ty < 0 || ty >= n) continue
        const tx2 = ((tx % n) + n) % n
        const url = `https://api.maptiler.com/maps/streets-v4-dark/${z}/${tx2}/${ty}.png?key=${kunciApi}`
        if (dimuat.has(url)) continue
        dimuat.add(url)
        const gambar = new Image()
        gambar.decoding = 'async'
        gambar.src = url
        window.__prapeta.push(gambar)
      }
    }
  }
}
