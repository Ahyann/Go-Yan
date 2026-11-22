import { useEffect, useState } from 'react'
import { addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query, setDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from '../context/AuthContext.jsx'

// Perkiraan bensin motor ojek (Yamaha Aerox 155 Cyber City 2023) tanpa sensor. Sumber angka yang benar adalah bar
// bensin di speedometer yang diketuk sendiri (sinkron). Di antara dua sinkron, sisa bensin diperkirakan turun menurut
// laju pemakaian per hari yang dipelajari dari sinkron-sinkron sebelumnya, dan ditampilkan sebagai rentang yang makin
// lebar kalau sudah lama tidak disinkron (motor juga dipakai di luar misi, jadi app tidak tahu pasti).
//
// Penyimpanan: Firestore di jalur khusus ojek (bensin_ojek, demo: bensin_ojek_demo) supaya tidak hilang saat ganti HP,
// dengan salinan di HP (localStorage) sebagai cadangan dan supaya tampilan langsung terisi. Akses ke jalur bensin_ojek
// dibatasi di aturan Firestore: hanya akun ojek.
export const JUMLAH_BAR = 6
export const KAPASITAS_LITER = 5.5
export const KM_PER_LITER = 40
export const HARGA_PER_LITER = 12500 // Pertamax, perkiraan; harga resmi bisa berubah
const LITER_PER_BAR = KAPASITAS_LITER / JUMLAH_BAR
const LAJU_AWAL = 0.8 // bar per hari sebelum app belajar kebiasaan pemakaian
const HARI_PERLU_SINKRON = 2
const HARI_MS = 86400000
const KUNCI = 'goyan:bensin'
const KUNCI_TRIP = 'goyan:bensin-trip'
const KUNCI_ISI = 'goyan:bensin-isi'
const KUNCI_MIGRASI = 'goyan:bensin-migrasi'
const MAKS_LOKAL = 500 // jumlah catatan terbaru yang disimpan/dimuat per jenis

function bacaJson(kunci, awal) {
  try {
    const d = JSON.parse(localStorage.getItem(kunci) || 'null')
    return d ?? awal
  } catch {
    return awal
  }
}

function tulisJson(kunci, nilai) {
  try { localStorage.setItem(kunci, JSON.stringify(nilai)) } catch { /* penyimpanan diblokir: berlaku selama app terbuka */ }
}

function bacaStatus() {
  const d = bacaJson(KUNCI, null)
  return d && typeof d.bar === 'number' && typeof d.waktu === 'number' ? d : null
}

function bacaDaftar(kunci) {
  const d = bacaJson(kunci, [])
  return Array.isArray(d) ? d : []
}

let data = bacaStatus() // { bar, waktu, laju, setelahIsi }
let daftarTrip = bacaDaftar(KUNCI_TRIP) // terbaru dulu: { waktu, km, menit, liter, rupiah, kasar }
let daftarIsi = bacaDaftar(KUNCI_ISI) // terbaru dulu: { waktu, rupiah, liter, penuh }
const pendengar = new Set()
let penulis = null // diisi useSinkronBensin kalau Firebase tersedia

function beritahu() {
  pendengar.forEach((f) => f())
}

function setStatusLokal(baru) {
  data = baru
  if (baru) tulisJson(KUNCI, baru)
  else try { localStorage.removeItem(KUNCI) } catch { /* penyimpanan diblokir */ }
  beritahu()
}

function setDaftarLokal(jenis, daftar) {
  const potong = daftar.slice(0, MAKS_LOKAL)
  if (jenis === 'trip') { daftarTrip = potong; tulisJson(KUNCI_TRIP, potong) } else { daftarIsi = potong; tulisJson(KUNCI_ISI, potong) }
  beritahu()
}

function tambahLokal(jenis, rekam) {
  const lama = jenis === 'trip' ? daftarTrip : daftarIsi
  setDaftarLokal(jenis, [rekam, ...lama].sort((a, b) => b.waktu - a.waktu))
}

function simpanStatus(baru) {
  setStatusLokal(baru)
  penulis?.status(baru).catch((e) => console.error('Gagal menyimpan status bensin:', e))
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
  simpanStatus({ bar: Math.max(0, Math.min(JUMLAH_BAR, bar)), waktu: sekarang, laju, setelahIsi: false })
}

// Isi bensin: nominal rupiah (atau 'penuh') diubah jadi liter dan ditambahkan ke perkiraan saat ini; tiap isi dicatat
export function catatIsiBensin(nominal) {
  const p = perkiraanBensin()
  const awal = p ? p.tengah : JUMLAH_BAR / 2
  const penuh = nominal === 'penuh'
  const tambahBar = penuh ? JUMLAH_BAR - awal : nominal / HARGA_PER_LITER / LITER_PER_BAR
  const liter = tambahBar * LITER_PER_BAR
  const rupiah = penuh ? Math.round((liter * HARGA_PER_LITER) / 500) * 500 : nominal
  simpanStatus({ bar: Math.min(JUMLAH_BAR, awal + tambahBar), waktu: Date.now(), laju: data?.laju || LAJU_AWAL, setelahIsi: true })
  const rekam = { waktu: Date.now(), rupiah, liter: Math.round(liter * 100) / 100, penuh }
  if (penulis) penulis.isi(rekam).catch(() => tambahLokal('isi', rekam))
  else tambahLokal('isi', rekam)
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

// ---------- Bensin per trip (dari live location) ----------
// Selama live location menyala, titik GPS yang cukup akurat dijumlahkan jaraknya. Saat live location dimatikan
// (biasanya di akhir misi), jarak dan lama perjalanan dicatat sebagai satu trip dengan perkiraan liter dan rupiah.
const AKURASI_MAKS = 50 // meter; titik yang lebih meleset dari ini diabaikan
const BOROS_MACET = 1.2 // konsumsi ditambah 20% kalau rata-rata lambat (banyak berhenti-jalan)
const KECEPATAN_MACET = 15 // km/jam

let pelacak = null // { mulai, jarakM, akhir: { lat, lng }, awal: { lat, lng } }

function jarakMeter(a, b) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
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
  if (penulis) penulis.trip(trip).catch(() => tambahLokal('trip', trip))
  else tambahLokal('trip', trip)
}

// Senin 00:00 minggu ini (jam HP), dipakai untuk total bensin minggu ini
function awalMinggu() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export function useTripBensin() {
  const [, setDetak] = useState(0)
  useEffect(() => {
    const ulang = () => setDetak((n) => n + 1)
    pendengar.add(ulang)
    return () => pendengar.delete(ulang)
  }, [])
  const daftar = daftarTrip
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

// ---------- Riwayat bulanan ----------
const NAMA_HARI = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

// Ringkasan satu bulan: total bensin untuk misi, jumlah trip, rata-rata per trip, hari paling ramai, porsi bensin
// untuk misi dibanding yang dibeli, catatan isi, dan total per minggu (M1: tanggal 1-7, M2: 8-14, dan seterusnya)
export function ringkasanBulan(bulan, tahun, trip = daftarTrip, isi = daftarIsi) {
  const dalamBulan = (w) => {
    const d = new Date(w)
    return d.getMonth() === bulan && d.getFullYear() === tahun
  }
  const tripBulan = trip.filter((t) => dalamBulan(t.waktu))
  const isiBulan = isi.filter((t) => dalamBulan(t.waktu))
  const rupiah = tripBulan.reduce((n, t) => n + t.rupiah, 0)
  const liter = tripBulan.reduce((n, t) => n + t.liter, 0)
  const km = tripBulan.reduce((n, t) => n + t.km, 0)
  const literBeli = isiBulan.reduce((n, t) => n + t.liter, 0)
  const rupiahBeli = isiBulan.reduce((n, t) => n + t.rupiah, 0)
  const perHari = new Array(7).fill(0)
  tripBulan.forEach((t) => { perHari[new Date(t.waktu).getDay()] += 1 })
  const idxRamai = perHari.indexOf(Math.max(...perHari))
  const perMinggu = [0, 0, 0, 0, 0]
  tripBulan.forEach((t) => { perMinggu[Math.min(4, Math.floor((new Date(t.waktu).getDate() - 1) / 7))] += t.rupiah })
  return {
    tripBulan,
    isiBulan,
    jumlahTrip: tripBulan.length,
    rupiah,
    liter,
    km,
    rataTrip: tripBulan.length ? Math.round(rupiah / tripBulan.length) : 0,
    hariRamai: tripBulan.length ? NAMA_HARI[idxRamai] : '-',
    literBeli,
    rupiahBeli,
    porsiMisi: literBeli > 0 ? Math.min(100, Math.round((liter / literBeli) * 100)) : null,
    perMinggu,
  }
}

export function useRiwayatBensin(bulan, tahun) {
  const [, setDetak] = useState(0)
  useEffect(() => {
    const ulang = () => setDetak((n) => n + 1)
    pendengar.add(ulang)
    return () => pendengar.delete(ulang)
  }, [])
  return ringkasanBulan(bulan, tahun)
}

// ---------- Reset dan sinkron Firebase ----------
// Hapus semua data bensin (perkiraan sisa bensin, catatan trip, dan catatan isi) di Firebase dan di HP ini
export async function resetBensin() {
  setStatusLokal(null)
  setDaftarLokal('trip', [])
  setDaftarLokal('isi', [])
  ;['status', 'trip', 'isi'].forEach(tandaiMigrasi)
  try {
    await penulis?.reset()
  } catch (e) {
    console.error('Gagal menghapus data bensin di Firebase:', e)
  }
}

// Penanda per jenis data: data lama di HP hanya dipindahkan ke Firebase sekali, saat Firebase terbukti masih kosong
const sudahMigrasi = (jenis) => { try { return localStorage.getItem(`${KUNCI_MIGRASI}-${jenis}`) === '1' } catch { return true } }
function tandaiMigrasi(jenis) {
  try { localStorage.setItem(`${KUNCI_MIGRASI}-${jenis}`, '1') } catch { /* penyimpanan diblokir */ }
}

async function hapusSemua(ref) {
  const snap = await getDocs(query(ref, limit(450)))
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  if (snap.size >= 450) await hapusSemua(ref)
}

// Dipasang sekali di layar ojek: menyambungkan data bensin ke Firestore (jalur bensin_ojek) dan memindahkan data lama
// dari HP ke Firebase kalau Firebase masih kosong. Kalau Firebase tidak bisa dipakai (offline atau aturan akses),
// data tetap berjalan dari HP.
export function useSinkronBensin() {
  const { user, isDemo } = useAuth()
  useEffect(() => {
    if (!user || !db) return undefined
    const nama = isDemo ? 'bensin_ojek_demo' : 'bensin_ojek'
    const refStatus = doc(db, nama, 'data')
    const refTrip = collection(db, nama, 'data', 'trip')
    const refIsi = collection(db, nama, 'data', 'isi')
    penulis = {
      status: (d) => setDoc(refStatus, d),
      trip: (d) => addDoc(refTrip, d),
      isi: (d) => addDoc(refIsi, d),
      reset: async () => {
        await Promise.all([hapusSemua(refTrip), hapusSemua(refIsi)])
        await setDoc(refStatus, { bar: null, hapus: Date.now() }) // dokumen kosong tanda sudah dihapus
      },
    }
    const galat = (e) => console.error('Sinkron bensin gagal, memakai data di HP:', e)

    // Keputusan memindahkan data lama hanya diambil dari balasan server (bukan dari cache), supaya tidak dobel
    const berhentiStatus = onSnapshot(refStatus, (snap) => {
      const d = snap.data()
      const dariServer = !snap.metadata.fromCache
      if (snap.exists() && typeof d.bar === 'number') {
        setStatusLokal(d)
        if (dariServer) tandaiMigrasi('status')
        return
      }
      if (!dariServer) return
      if (!snap.exists() && data && !sudahMigrasi('status')) {
        setDoc(refStatus, data).catch(galat) // pindahkan data lama di HP ke Firebase
        return
      }
      tandaiMigrasi('status')
      if (snap.exists() && d.bar === null && data) setStatusLokal(null) // sudah di-reset dari perangkat lain
    }, galat)

    const dengarDaftar = (ref, jenis, lokal) => onSnapshot(query(ref, orderBy('waktu', 'desc'), limit(MAKS_LOKAL)), (snap) => {
      const dariServer = !snap.metadata.fromCache
      if (snap.empty) {
        if (!dariServer) return
        if (lokal().length > 0 && !sudahMigrasi(jenis)) {
          lokal().slice(0, 200).forEach((r) => addDoc(ref, r).catch(galat)) // pindahkan data lama di HP ke Firebase
          return
        }
        tandaiMigrasi(jenis)
        setDaftarLokal(jenis, [])
        return
      }
      if (dariServer) tandaiMigrasi(jenis)
      setDaftarLokal(jenis, snap.docs.map((x) => ({ ...x.data() })))
    }, galat)
    const berhentiTrip = dengarDaftar(refTrip, 'trip', () => daftarTrip)
    const berhentiIsi = dengarDaftar(refIsi, 'isi', () => daftarIsi)

    return () => {
      berhentiStatus()
      berhentiTrip()
      berhentiIsi()
      penulis = null
    }
  }, [user, isDemo])
}
