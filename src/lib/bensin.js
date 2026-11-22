import { useEffect, useState } from 'react'

// Perkiraan bensin motor ojek (Yamaha Aerox 155 Cyber City 2023) tanpa sensor. Sumber angka yang benar adalah bar
// bensin di speedometer yang diketuk sendiri (sinkron). Di antara dua sinkron, sisa bensin diperkirakan turun menurut
// laju pemakaian per hari yang dipelajari dari sinkron-sinkron sebelumnya, dan ditampilkan sebagai rentang yang makin
// lebar kalau sudah lama tidak disinkron (motor juga dipakai di luar misi, jadi app tidak tahu pasti).
export const JUMLAH_BAR = 6
export const KAPASITAS_LITER = 5.5
export const KM_PER_LITER = 40
export const HARGA_PER_LITER = 12500 // Pertamax, perkiraan; harga resmi bisa berubah
const LITER_PER_BAR = KAPASITAS_LITER / JUMLAH_BAR
const LAJU_AWAL = 0.8 // bar per hari sebelum app belajar kebiasaan pemakaian
const HARI_PERLU_SINKRON = 2
const KUNCI = 'goyan:bensin'
const HARI_MS = 86400000

function baca() {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI) || 'null')
    return d && typeof d.bar === 'number' && typeof d.waktu === 'number' ? d : null
  } catch {
    return null
  }
}

let data = baca()
const pendengar = new Set()

function simpan(baru) {
  data = baru
  try { localStorage.setItem(KUNCI, JSON.stringify(baru)) } catch { /* penyimpanan diblokir: berlaku selama app terbuka */ }
  pendengar.forEach((f) => f())
}

// Perkiraan saat ini: pasti (bar yang hampir pasti masih ada), mungkin (batas atas), tengah (perkiraan terbaik)
export function perkiraanBensin(sekarang = Date.now()) {
  if (!data) return null
  const laju = data.laju || LAJU_AWAL
  const hari = Math.max(0, (sekarang - data.waktu) / HARI_MS)
  const turun = hari * laju
  const tengah = Math.max(0, data.bar - turun)
  const pasti = Math.max(0, Math.floor(data.bar - turun * 1.5))
  const mungkin = Math.max(pasti, Math.min(data.bar, Math.ceil(data.bar - turun * 0.5)))
  const liter = tengah * LITER_PER_BAR
  const kurangLiter = Math.max(0, KAPASITAS_LITER - liter)
  return {
    tengah,
    pasti,
    mungkin,
    liter,
    km: liter * KM_PER_LITER,
    hari,
    laju,
    perluSinkron: hari >= HARI_PERLU_SINKRON && mungkin > pasti,
    biayaPenuh: Math.round((kurangLiter * HARGA_PER_LITER) / 1000) * 1000,
    hariAman: Math.max(0, Math.floor((tengah - 1) / laju)),
  }
}

// Bar diketuk sesuai speedometer. Kalau sinkron sebelumnya bukan hasil isi bensin, laju pemakaian ikut dipelajari.
export function sinkronBensin(bar) {
  const sekarang = Date.now()
  let laju = data?.laju || LAJU_AWAL
  if (data && !data.setelahIsi) {
    const hari = (sekarang - data.waktu) / HARI_MS
    if (hari > 0.3 && data.bar > bar) {
      const amatan = Math.min(3, Math.max(0.1, (data.bar - bar) / hari))
      laju = laju * 0.6 + amatan * 0.4
    }
  }
  simpan({ bar: Math.max(0, Math.min(JUMLAH_BAR, bar)), waktu: sekarang, laju, setelahIsi: false })
}

// Isi bensin: nominal rupiah (atau 'penuh') diubah jadi liter dan ditambahkan ke perkiraan saat ini
export function catatIsiBensin(nominal) {
  const p = perkiraanBensin()
  const awal = p ? p.tengah : 0
  const tambahBar = nominal === 'penuh' ? JUMLAH_BAR : nominal / HARGA_PER_LITER / LITER_PER_BAR
  simpan({ bar: Math.min(JUMLAH_BAR, awal + tambahBar), waktu: Date.now(), laju: data?.laju || LAJU_AWAL, setelahIsi: true })
}

// Perkiraan bensin yang diperbarui setiap menit dan setiap kali ada sinkron / isi
export function useBensin() {
  const [, setDetak] = useState(0)
  useEffect(() => {
    const ulang = () => setDetak((n) => n + 1)
    pendengar.add(ulang)
    const id = setInterval(ulang, 60000)
    return () => {
      pendengar.delete(ulang)
      clearInterval(id)
    }
  }, [])
  return perkiraanBensin()
}

// Hapus semua data bensin (perkiraan sisa bensin dan daftar bensin per trip) di HP ini
export function resetBensin() {
  data = null
  try { localStorage.removeItem(KUNCI); localStorage.removeItem('goyan:bensin-trip') } catch { /* penyimpanan diblokir */ }
  pendengar.forEach((f) => f())
  pendengarTrip.forEach((f) => f())
}

// ---------- Bensin per trip (dari live location) ----------
// Selama live location menyala, titik GPS yang cukup akurat dijumlahkan jaraknya. Saat live location dimatikan
// (biasanya di akhir misi), jarak dan lama perjalanan dicatat sebagai satu trip dengan perkiraan liter dan rupiah.
const KUNCI_TRIP = 'goyan:bensin-trip'
const MAKS_TRIP = 60
const AKURASI_MAKS = 50 // meter; titik yang lebih meleset dari ini diabaikan
const BOROS_MACET = 1.2 // konsumsi ditambah 20% kalau rata-rata lambat (banyak berhenti-jalan)
const KECEPATAN_MACET = 15 // km/jam

let pelacak = null // { mulai, jarakM, akhir: { lat, lng }, awal: { lat, lng } }
const pendengarTrip = new Set()

function jarakMeter(a, b) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function bacaTrip() {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI_TRIP) || '[]')
    return Array.isArray(d) ? d : []
  } catch {
    return []
  }
}

export function mulaiLacakTrip() {
  pelacak = { mulai: Date.now(), jarakM: 0, akhir: null, awal: null }
}

export function catatTitikTrip(lat, lng, akurasi) {
  if (!pelacak || (akurasi != null && akurasi > AKURASI_MAKS)) return
  const titik = { lat, lng }
  if (!pelacak.awal) pelacak.awal = titik
  if (pelacak.akhir) {
    const d = jarakMeter(pelacak.akhir, titik)
    if (d < 5) return
    pelacak.jarakM += d
  }
  pelacak.akhir = titik
}

export function selesaiLacakTrip() {
  if (!pelacak) return
  const p = pelacak
  pelacak = null
  const menit = (Date.now() - p.mulai) / 60000
  // Cadangan kalau GPS sempat berhenti (layar terkunci): garis lurus awal-akhir dikali 1,3 untuk belokan jalan
  const lurus = p.awal && p.akhir ? jarakMeter(p.awal, p.akhir) * 1.3 : 0
  const km = Math.max(p.jarakM, lurus) / 1000
  if (km < 0.2 && menit < 2) return
  const kasar = lurus > p.jarakM
  const kecepatan = menit > 0 ? km / (menit / 60) : 0
  const liter = (km / KM_PER_LITER) * (kecepatan > 0 && kecepatan < KECEPATAN_MACET ? BOROS_MACET : 1)
  const trip = { waktu: Date.now(), km, menit, liter, rupiah: Math.round(liter * HARGA_PER_LITER), kasar }
  const daftar = [trip, ...bacaTrip()].slice(0, MAKS_TRIP)
  try { localStorage.setItem(KUNCI_TRIP, JSON.stringify(daftar)) } catch { /* penyimpanan diblokir */ }
  pendengarTrip.forEach((f) => f())
}

// Senin 00:00 minggu ini (jam HP), dipakai untuk total bensin minggu ini
function awalMinggu() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export function useTripBensin() {
  const [daftar, setDaftar] = useState(bacaTrip)
  useEffect(() => {
    const ulang = () => setDaftar(bacaTrip())
    pendengarTrip.add(ulang)
    return () => pendengarTrip.delete(ulang)
  }, [])
  const mulai = awalMinggu()
  const minggu = daftar.filter((t) => t.waktu >= mulai)
  return {
    daftar,
    minggu: {
      jumlah: minggu.length,
      km: minggu.reduce((n, t) => n + t.km, 0),
      liter: minggu.reduce((n, t) => n + t.liter, 0),
      rupiah: minggu.reduce((n, t) => n + t.rupiah, 0),
    },
  }
}
