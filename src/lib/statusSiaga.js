import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const KEY_CUACA = 'goyan:cuaca'
const BASI_CUACA_MS = 15 * 60 * 1000 // cuaca dianggap segar selama 15 menit
const CEK_LOKASI_MS = 60 * 1000
const JAM_PRAKIRAAN = 24
export const LOKASI_DEMO = { lat: -6.2088, lng: 106.8456 } // Jakarta, dipakai mode demo supaya tidak meminta izin lokasi
let sudahMintaIzin = false // permintaan izin lokasi hanya dimunculkan sekali per sesi app

export const TEKS_STATUS = {
  id: {
    gps: 'SINYAL GPS', trip: 'TOTAL TRIP', cuaca: 'CUACA',
    sinyal: ['MATI', 'LEMAH', 'SEDANG', 'BAIK', 'KUAT'],
    kode: { cerah: 'CERAH', sebagian: 'BERAWAN', mendung: 'MENDUNG', kabut: 'KABUT', gerimis: 'GERIMIS', hujan: 'HUJAN', petir: 'PETIR' },
  },
  en: {
    gps: 'GPS SIGNAL', trip: 'TOTAL TRIPS', cuaca: 'WEATHER',
    sinyal: ['OFF', 'WEAK', 'FAIR', 'GOOD', 'STRONG'],
    kode: { cerah: 'CLEAR', sebagian: 'PT CLOUDY', mendung: 'OVERCAST', kabut: 'FOG', gerimis: 'DRIZZLE', hujan: 'RAIN', petir: 'STORM' },
  },
}

// Kode cuaca WMO dari Open-Meteo -> jenis ikon
export function jenisCuaca(kode) {
  if (kode === 0) return 'cerah'
  if (kode === 1 || kode === 2) return 'sebagian'
  if (kode === 3) return 'mendung'
  if (kode === 45 || kode === 48) return 'kabut'
  if (kode >= 51 && kode <= 57) return 'gerimis'
  if ((kode >= 61 && kode <= 67) || (kode >= 80 && kode <= 82)) return 'hujan'
  if (kode >= 95) return 'petir'
  return 'mendung'
}

export function tingkatSinyal(akurasi) {
  if (akurasi == null) return 0
  if (akurasi <= 20) return 4
  if (akurasi <= 50) return 3
  if (akurasi <= 150) return 2
  return 1
}

function bacaCache() {
  try { return JSON.parse(localStorage.getItem(KEY_CUACA) || 'null') } catch { return null }
}

// Posisi diminta sekali saat app dibuka (izin lokasi memang dibutuhkan ojek); sesudahnya dicek tiap menit selama izin ada
// dan tidak ditolak. Akurasi posisi dipakai sebagai kekuatan sinyal GPS: makin kecil meter, makin kuat. Cuaca dan prakiraan
// 24 jam dari Open-Meteo (tanpa kunci), memakai koordinat yang dibulatkan ke 2 desimal (±1 km) dan disimpan 15 menit.
// cuaca: { suhu, kode, nama, jam: [{ tgl: 'YYYY-MM-DD', w: 'HH:MM', suhu, kode, hujan }] }; nama = nama tempat (kosong kalau gagal dicari)
export function useStatusSiaga(lokasiAktif) {
  const { isDemo } = useAuth()
  const [akurasi, setAkurasi] = useState(null) // null: GPS mati / belum ada izin
  const [cuaca, setCuaca] = useState(() => {
    const c = bacaCache()
    return c ? { suhu: c.suhu, kode: c.kode, nama: c.nama || '', jam: Array.isArray(c.jam) ? c.jam : [] } : null
  })

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return undefined
    let batal = false
    let izin = null
    let kontrol = null

    function ambilCuaca(lat, lng) {
      const cache = bacaCache()
      const la = Math.round(lat * 100) / 100
      const lo = Math.round(lng * 100) / 100
      if (cache && Array.isArray(cache.jam) && cache.jam.length >= JAM_PRAKIRAAN && typeof cache.nama === 'string' && Date.now() - cache.waktu < BASI_CUACA_MS && cache.lat === la && cache.lng === lo) return
      kontrol?.abort()
      kontrol = new AbortController()
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=2&timezone=auto`
      fetch(url, { signal: kontrol.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('cuaca ' + r.status))))
        .then((d) => {
          const suhu = Math.round(d?.current?.temperature_2m)
          const kode = d?.current?.weather_code
          if (batal || !Number.isFinite(suhu) || typeof kode !== 'number') return
          const h = d?.hourly
          const sekarangJam = String(d?.current?.time || '').slice(0, 13) // 'YYYY-MM-DDTHH' menurut zona waktu lokasi
          let jam = []
          if (h && Array.isArray(h.time)) {
            let i0 = h.time.findIndex((t) => t.slice(0, 13) >= sekarangJam)
            if (i0 < 0) i0 = 0
            jam = h.time.slice(i0, i0 + JAM_PRAKIRAAN).map((t, i) => ({
              tgl: t.slice(0, 10),
              w: t.slice(11, 16),
              suhu: Math.round(h.temperature_2m?.[i0 + i]),
              kode: h.weather_code?.[i0 + i],
              hujan: h.precipitation_probability?.[i0 + i] ?? 0,
            }))
          }
          setCuaca((lama) => ({ suhu, kode, jam, nama: lama?.nama || '' }))
          const simpan = (nama) => {
            if (batal) return
            setCuaca((lama) => ({ ...(lama || { suhu, kode, jam }), nama }))
            try { localStorage.setItem(KEY_CUACA, JSON.stringify({ waktu: Date.now(), lat: la, lng: lo, suhu, kode, jam, nama })) } catch { /* penyimpanan diblokir */ }
          }
          // Nama tempat dari koordinat (dibulatkan ±1 km), layanan tanpa kunci; gagal -> nama kosong dan tulisan pengganti
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${la}&longitude=${lo}&localityLanguage=id`, { signal: kontrol.signal })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('lokasi ' + r.status))))
            .then((g) => simpan(String(g?.locality || g?.city || g?.principalSubdivision || '').toUpperCase()))
            .catch(() => simpan(''))
        })
        .catch(() => { /* offline atau ditolak: pakai cuaca terakhir kalau ada */ })
    }

    function cekLokasi() {
      const butuhIzin = !izin || izin.state === 'prompt'
      if (izin?.state === 'denied' || (butuhIzin && sudahMintaIzin)) {
        setAkurasi(null)
        return
      }
      if (butuhIzin) sudahMintaIzin = true
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (batal) return
          setAkurasi(pos.coords.accuracy)
          ambilCuaca(pos.coords.latitude, pos.coords.longitude)
        },
        () => { if (!batal) setAkurasi(null) },
        { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 }
      )
    }

    async function mulai() {
      try {
        izin = await navigator.permissions.query({ name: 'geolocation' })
        izin.onchange = cekLokasi
      } catch {
        izin = null // browser tidak bisa menanyakan izin: langsung minta posisi (sekali)
      }
      if (!batal) cekLokasi()
    }

    // Mode demo: tanpa pop-up izin lokasi. Memakai titik tetap di Jakarta dan sinyal GPS contoh supaya layar langsung terisi.
    if (isDemo) {
      setAkurasi(10)
      ambilCuaca(LOKASI_DEMO.lat, LOKASI_DEMO.lng)
      return () => {
        batal = true
        kontrol?.abort()
      }
    }

    mulai()
    const id = setInterval(cekLokasi, CEK_LOKASI_MS)
    return () => {
      batal = true
      clearInterval(id)
      kontrol?.abort()
      if (izin) izin.onchange = null
    }
  }, [lokasiAktif, isDemo])

  return { akurasi, cuaca }
}
