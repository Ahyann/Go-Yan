import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'

const KEY_CUACA = 'goyan:cuaca'
const BASI_CUACA_MS = 15 * 60 * 1000 // cuaca dianggap segar selama 15 menit
const CEK_LOKASI_MS = 60 * 1000
let sudahMintaIzin = false // permintaan izin lokasi hanya dimunculkan sekali per sesi app

const TEKS = {
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
function jenisCuaca(kode) {
  if (kode === 0) return 'cerah'
  if (kode === 1 || kode === 2) return 'sebagian'
  if (kode === 3) return 'mendung'
  if (kode === 45 || kode === 48) return 'kabut'
  if (kode >= 51 && kode <= 57) return 'gerimis'
  if ((kode >= 61 && kode <= 67) || (kode >= 80 && kode <= 82)) return 'hujan'
  if (kode >= 95) return 'petir'
  return 'mendung'
}

function bacaCache() {
  try { return JSON.parse(localStorage.getItem(KEY_CUACA) || 'null') } catch { return null }
}

// Posisi diminta sekali saat app dibuka (izin lokasi memang dibutuhkan ojek); sesudahnya dicek tiap menit selama izin ada
// dan tidak ditolak. Akurasi posisi
// dipakai sebagai kekuatan sinyal GPS: makin kecil meter, makin kuat. Cuaca dari Open-Meteo (tanpa kunci), memakai
// koordinat yang dibulatkan ke 2 desimal (±1 km) dan disimpan 15 menit supaya tidak sering memanggil.
function useStatusSiaga(lokasiAktif) {
  const [akurasi, setAkurasi] = useState(null) // null: GPS mati / belum ada izin
  const [cuaca, setCuaca] = useState(() => {
    const c = bacaCache()
    return c ? { suhu: c.suhu, kode: c.kode } : null
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
      if (cache && Date.now() - cache.waktu < BASI_CUACA_MS && cache.lat === la && cache.lng === lo) return
      kontrol?.abort()
      kontrol = new AbortController()
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,weather_code`, { signal: kontrol.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('cuaca ' + r.status))))
        .then((d) => {
          const suhu = Math.round(d?.current?.temperature_2m)
          const kode = d?.current?.weather_code
          if (batal || !Number.isFinite(suhu) || typeof kode !== 'number') return
          setCuaca({ suhu, kode })
          try { localStorage.setItem(KEY_CUACA, JSON.stringify({ waktu: Date.now(), lat: la, lng: lo, suhu, kode })) } catch { /* penyimpanan diblokir */ }
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

    mulai()
    const id = setInterval(cekLokasi, CEK_LOKASI_MS)
    return () => {
      batal = true
      clearInterval(id)
      kontrol?.abort()
      if (izin) izin.onchange = null
    }
  }, [lokasiAktif])

  return { akurasi, cuaca }
}

function tingkatSinyal(akurasi) {
  if (akurasi == null) return 0
  if (akurasi <= 20) return 4
  if (akurasi <= 50) return 3
  if (akurasi <= 150) return 2
  return 1
}

const svg = { shapeRendering: 'crispEdges', style: { flexShrink: 0, display: 'block' } }

function IkonCuaca({ jenis }) {
  const awan = <g fill="#DCEBFF" className="ik-awan"><rect x="2" y="8" width="10" height="3" /><rect x="3" y="7" width="3" height="1" /><rect x="5" y="5" width="4" height="3" /><rect x="1" y="9" width="1" height="1" /></g>
  const matahari = (
    <>
      <rect x="8" y="1" width="4" height="4" fill="#FFD84A" />
      <g fill="#FFD84A" className="ik-sinar"><rect x="9" y="0" width="2" height="1" /><rect x="12" y="2" width="2" height="2" /><rect x="7" y="2" width="1" height="2" /><rect x="12" y="1" width="1" height="1" /></g>
    </>
  )
  const tetes = (xs) => <g fill="#5ED0FF">{xs.map((x, i) => <rect key={x} className="ik-tetes" style={{ animationDelay: `${i * 0.25}s` }} x={x} y="11" width="1" height="1" />)}</g>
  return (
    <svg width="17" height="14" viewBox="0 0 14 12" aria-hidden="true" {...svg}>
      {jenis === 'cerah' && <><rect x="4" y="4" width="6" height="5" fill="#FFD84A" /><rect x="5" y="3" width="4" height="7" fill="#FFD84A" /><g fill="#FFD84A" className="ik-sinar"><rect x="6" y="0" width="2" height="2" /><rect x="6" y="11" width="2" height="1" /><rect x="1" y="5" width="2" height="2" /><rect x="11" y="5" width="2" height="2" /></g></>}
      {jenis === 'sebagian' && <>{matahari}{awan}</>}
      {jenis === 'mendung' && awan}
      {jenis === 'kabut' && <><g fill="#DCEBFF"><rect x="2" y="3" width="10" height="1" /><rect x="1" y="6" width="10" height="1" /><rect x="3" y="9" width="9" height="1" /></g></>}
      {(jenis === 'gerimis' || jenis === 'hujan') && <>{awan}{tetes(jenis === 'hujan' ? [3, 6, 9] : [4, 8])}</>}
      {jenis === 'petir' && <>{awan}<g fill="#FFD84A" className="ik-sinar"><rect x="6" y="9" width="2" height="1" /><rect x="5" y="10" width="2" height="1" /><rect x="6" y="11" width="1" height="1" /></g></>}
    </svg>
  )
}

function IkonSinyal({ tingkat }) {
  const warna = tingkat >= 3 ? '#4ADE80' : tingkat === 2 ? '#FFD84A' : '#ED1C24'
  return (
    <svg width="17" height="12" viewBox="0 0 14 10" aria-hidden="true" {...svg}>
      {[3, 5, 7, 10].map((h, i) => (
        <rect key={i} x={i * 4} y={10 - h} width="2" height={h} fill={i < tingkat ? warna : '#2B4A63'} className={i === tingkat - 1 ? 'ik-denyut' : undefined} />
      ))}
    </svg>
  )
}

// Piala emas piksel: kilap putih menyapu badan piala sesekali dan ada kilau kecil di pojok kanan atas
function IkonTrip() {
  const bentuk = (
    <>
      <rect x="2" y="1" width="8" height="4" />
      <rect x="3" y="5" width="6" height="1" />
      <rect x="5" y="6" width="2" height="3" />
      <rect x="3" y="9" width="6" height="2" />
      <rect x="0" y="1" width="2" height="1" />
      <rect x="0" y="2" width="1" height="2" />
      <rect x="10" y="1" width="2" height="1" />
      <rect x="11" y="2" width="1" height="2" />
    </>
  )
  return (
    <svg width="17" height="16" viewBox="0 0 14 13" aria-hidden="true" {...svg}>
      <defs><clipPath id="ik-piala-klip">{bentuk}</clipPath></defs>
      <g fill="#FFD84A">{bentuk}</g>
      <rect x="3" y="2" width="1" height="2" fill="#FFF4B0" />
      <rect x="3" y="9" width="6" height="1" fill="#C99A12" />
      <g clipPath="url(#ik-piala-klip)">
        <g className="ik-kilap"><rect x="-1" y="0" width="2" height="12" fill="#FFFFFF" opacity="0.9" /><rect x="2" y="0" width="1" height="12" fill="#FFFFFF" opacity="0.5" /></g>
      </g>
      <g fill="#FFFFFF" className="ik-kilau"><rect x="12" y="0" width="1" height="3" /><rect x="11" y="1" width="3" height="1" /></g>
    </svg>
  )
}

// Baris di bawah jam konsol ojek saat siaga: cuaca, sinyal GPS, dan total trip, dengan ikon piksel.
export default function BarisStatusSiaga({ totalTrip = null, lokasiAktif = false }) {
  const { lang } = useLanguage()
  const k = TEKS[lang] || TEKS.id
  const { akurasi, cuaca } = useStatusSiaga(lokasiAktif)
  const tingkat = tingkatSinyal(akurasi)
  const jenis = cuaca ? jenisCuaca(cuaca.kode) : null

  const slot = (ikon, nilai, label) => (
    <span style={s.slot}>
      {ikon}
      <span style={s.teks}>
        <span style={s.nilai}>{nilai}</span>
        <span style={s.label}>{label}</span>
      </span>
    </span>
  )

  return (
    <div role="group" aria-label={`${cuaca ? `${cuaca.suhu}°, ${k.kode[jenis]}` : k.cuaca}; ${k.gps} ${k.sinyal[tingkat]}; ${k.trip} ${totalTrip ?? '-'}`} style={s.baris}>
      {slot(jenis ? <IkonCuaca jenis={jenis} /> : <IkonCuaca jenis="mendung" />, cuaca ? `${cuaca.suhu}°` : '--°', jenis ? k.kode[jenis] : k.cuaca)}
      {slot(<IkonSinyal tingkat={tingkat} />, k.sinyal[tingkat], k.gps)}
      {slot(<IkonTrip />, totalTrip ?? '--', k.trip)}
    </div>
  )
}

const s = {
  baris: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 26, borderTop: '1px solid rgba(94, 208, 255, 0.22)', paddingTop: 4 },
  slot: { display: 'inline-flex', alignItems: 'center', gap: 7 },
  teks: { display: 'flex', flexDirection: 'column', lineHeight: 1.05 },
  nilai: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.04em', color: '#FFFFFF', whiteSpace: 'nowrap' },
  label: { fontSize: 6, letterSpacing: '0.14em', opacity: 0.6, whiteSpace: 'nowrap', marginTop: 1 },
}
