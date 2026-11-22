import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { JUMLAH_BAR, catatIsiBensin, sinkronBensin, useBensin, useTripBensin } from '../lib/bensin'
import { playGeserHalus, playGeserTik, playLunasSemua } from '../lib/sound'
import { getar } from '../lib/getar'
import { IkonPompa, MeterBensin, warnaBar } from './BarisStatusSiaga.jsx'

const TEKS = {
  id: {
    kembali: 'KEMBALI', status: 'STATUS:', ketuk: 'KETUK SESUAI SPEEDOMETER', aman: 'AMAN ±{n} HARI', segera: 'SEGERA ISI', sekarang: 'ISI SEKARANG',
    sinkron: 'PERLU SINKRON', belum: 'KETUK BAR DULU', isiPenuh: 'ISI PENUH ±Rp ', catat: 'CATAT ISI', spbu: 'SPBU', cari: 'CARI SPBU', penuh: 'PENUH',
    terakhir: 'SINKRON {n} HARI LALU', mingguIni: 'MINGGU INI', trip: 'TRIP', kosongTrip: 'NYALAKAN LIVE LOCATION SAAT MISI UNTUK MENGHITUNG BENSIN PER TRIP',
    hal1: 'Sisa bensin', hal2: 'Bensin per trip', bar: 'Bensin {n} dari 6 bar', mnt: 'MNT',
  },
  en: {
    kembali: 'BACK', status: 'STATUS:', ketuk: 'TAP TO MATCH YOUR GAUGE', aman: 'OK ±{n} DAYS', segera: 'REFUEL SOON', sekarang: 'REFUEL NOW',
    sinkron: 'NEEDS SYNC', belum: 'TAP THE BARS', isiPenuh: 'FILL UP ±Rp ', catat: 'LOG FILL', spbu: 'GAS', cari: 'FIND GAS', penuh: 'FULL',
    terakhir: 'SYNCED {n} DAYS AGO', mingguIni: 'THIS WEEK', trip: 'TRIPS', kosongTrip: 'TURN ON LIVE LOCATION DURING MISSIONS TO COUNT FUEL PER TRIP',
    hal1: 'Fuel left', hal2: 'Fuel per trip', bar: 'Fuel {n} of 6 bars', mnt: 'MIN',
  },
}
const PILIHAN_ISI = [10000, 20000, 30000, 'penuh']

const rupiah = (n) => Math.round(n).toLocaleString('id-ID')
const desimal = (n, d = 1) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })

function jarakKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// SPBU terdekat dari data OpenStreetMap (Overpass, tanpa kunci), dicari sekali saat halaman bensin dibuka
function useSpbuTerdekat() {
  const [spbu, setSpbu] = useState(null) // null: belum / gagal, { lat, lng, km }
  useEffect(() => {
    if (!navigator.geolocation) return undefined
    let batal = false
    const kontrol = new AbortController()
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const asal = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const q = `[out:json][timeout:10];node(around:4000,${asal.lat},${asal.lng})[amenity=fuel];out 20;`
        fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, { signal: kontrol.signal })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error('spbu ' + r.status))))
          .then((d) => {
            const daftar = (d?.elements || []).map((e) => ({ lat: e.lat, lng: e.lon, km: jarakKm(asal, { lat: e.lat, lng: e.lon }) }))
            daftar.sort((a, b) => a.km - b.km)
            if (!batal && daftar[0]) setSpbu(daftar[0])
          })
          .catch(() => { /* offline atau gagal: tombol membuka pencarian SPBU di Google Maps */ })
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 }
    )
    return () => {
      batal = true
      kontrol.abort()
    }
  }, [])
  return spbu
}

// Halaman bensin di layar konsol ojek, dua halaman yang bisa digeser:
// 1) sisa bensin: ketuk bar sesuai speedometer (sinkron), biaya isi penuh, catat isi, SPBU terdekat
// 2) bensin per trip dari live location: total minggu ini dan beberapa trip terakhir
export default function KonsolBensin({ onKembali }) {
  const { lang } = useLanguage()
  const k = TEKS[lang] || TEKS.id
  const b = useBensin()
  const { daftar, minggu } = useTripBensin()
  const spbu = useSpbuTerdekat()
  const [halaman, setHalaman] = useState(0)
  const [modeCatat, setModeCatat] = useState(false)
  const sentuhAwal = useRef(null)

  const pindah = (h) => {
    if (h === halaman || h < 0 || h > 1) return
    setHalaman(h)
    playGeserHalus()
  }
  const sentuhMulai = (e) => { sentuhAwal.current = e.touches[0].clientX }
  const sentuhSelesai = (e) => {
    if (sentuhAwal.current === null) return
    const d = sentuhAwal.current - e.changedTouches[0].clientX
    if (d > 35) pindah(halaman + 1)
    else if (d < -35) pindah(halaman - 1)
    sentuhAwal.current = null
  }

  function ketukBar(i) {
    const n = b && Math.round(b.tengah) === i + 1 && !b.perluSinkron ? i : i + 1 // ketuk bar yang sama lagi: turun satu
    sinkronBensin(n)
    playGeserTik(n)
    getar(10)
  }

  function catat(nominal) {
    catatIsiBensin(nominal)
    setModeCatat(false)
    playLunasSemua()
    getar([15, 40, 15])
  }

  function bukaSpbu() {
    const url = spbu
      ? `https://www.google.com/maps/dir/?api=1&destination=${spbu.lat},${spbu.lng}&travelmode=driving`
      : 'https://www.google.com/maps/search/SPBU/'
    window.open(url, '_blank', 'noopener')
  }

  // Status di pojok kanan
  let status = k.belum
  let warna = '#FF9A3C'
  if (b) {
    if (b.tengah <= 1) { status = k.sekarang; warna = '#ED1C24' }
    else if (b.tengah <= 2) { status = k.segera; warna = '#FF9A3C' }
    else if (b.perluSinkron) { status = k.sinkron; warna = '#FF9A3C' }
    else { status = k.aman.replace('{n}', b.hariAman); warna = '#4ADE80' }
  }
  if (halaman === 1) { status = `${k.mingguIni} ±Rp ${rupiah(minggu.rupiah)}`; warna = '#FF9A3C' }

  const tombol = (teks, onKlik, gaya = {}) => (
    <button type="button" className="tekan" onClick={onKlik} style={{ ...s.tombol, ...gaya }}>{teks}</button>
  )

  return (
    <div className="tv-nyala">
      <div style={s.kepala}>
        <button type="button" onClick={onKembali} style={s.kembali} aria-label={k.kembali}>
          <span aria-hidden="true" style={{ color: '#5ED0FF' }}>◀</span> {k.kembali}
        </button>
        <span style={s.titikRow} role="tablist">
          {[k.hal1, k.hal2].map((nama, i) => (
            <button key={nama} type="button" role="tab" aria-selected={halaman === i} aria-label={nama} onClick={() => pindah(i)} style={s.titikTombol}>
              <i style={{ ...s.titik, width: halaman === i ? 12 : 5, background: halaman === i ? '#5ED0FF' : '#3F566E' }} />
            </button>
          ))}
        </span>
        <span style={s.status}><span style={{ opacity: 0.6, color: '#E8EDF9' }}>{k.status}</span> <span style={{ color: warna }}>{status}</span></span>
      </div>

      <div style={s.viewport} onTouchStart={sentuhMulai} onTouchEnd={sentuhSelesai}>
        <div style={{ ...s.track, transform: `translateX(-${halaman * 50}%)` }}>
          {/* Halaman 1: sisa bensin */}
          <div style={s.halaman}>
            <div style={s.kiri}>
              <span style={s.kecil}>{b && b.perluSinkron ? k.terakhir.replace('{n}', Math.floor(b.hari)) : k.ketuk}</span>
              <span style={{ display: 'flex', gap: 3 }} role="group" aria-label={k.ketuk}>
                {Array.from({ length: JUMLAH_BAR }, (_, i) => {
                  const pasti = b ? b.pasti : 0
                  const mungkin = b ? b.mungkin : 0
                  const w = warnaBar(pasti || mungkin)
                  const isi = i < pasti ? w : i < mungkin ? `repeating-linear-gradient(135deg, ${w} 0 2px, transparent 2px 4px)` : '#1E3A52'
                  return (
                    <button
                      key={i}
                      type="button"
                      data-tanpa-suara
                      aria-label={k.bar.replace('{n}', i + 1)}
                      onClick={() => ketukBar(i)}
                      className={i >= pasti && i < mungkin ? 'bar-ragu' : undefined}
                      style={{ ...s.barBesar, background: isi }}
                    />
                  )
                })}
              </span>
              <span style={s.angka}>{b ? `±${desimal(b.liter)} L · ${Math.round(b.km)} KM` : '-- L · -- KM'}</span>
            </div>
            <div style={s.kanan}>
              {modeCatat ? (
                <span style={s.pilihanIsi}>
                  {PILIHAN_ISI.map((n) => tombol(n === 'penuh' ? k.penuh : `${n / 1000}RB`, () => catat(n), n === 'penuh' ? s.tombolHijau : null))}
                  {tombol('✕', () => setModeCatat(false), s.tombolRedup)}
                </span>
              ) : (
                <>
                  <span style={s.biaya}>{b ? `${k.isiPenuh}${rupiah(b.biayaPenuh)}` : ''}</span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {tombol(k.catat, () => setModeCatat(true))}
                    {tombol(spbu ? `${k.spbu} ${desimal(spbu.km)} KM ▶` : `${k.cari} ▶`, bukaSpbu, s.tombolOranye)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Halaman 2: bensin per trip */}
          <div style={s.halaman}>
            <div style={s.kiri}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IkonPompa /><span style={s.kecil}>{k.mingguIni}</span></span>
              <span style={s.angka}>±Rp {rupiah(minggu.rupiah)}</span>
              <span style={s.kecil}>{minggu.jumlah} {k.trip} · {desimal(minggu.km)} KM · {desimal(minggu.liter, 2)} L</span>
            </div>
            <div style={{ ...s.kanan, gap: 3 }}>
              {daftar.length === 0 ? (
                <span style={{ ...s.kecil, whiteSpace: 'normal', lineHeight: 1.4 }}>{k.kosongTrip}</span>
              ) : (
                daftar.slice(0, 3).map((t) => {
                  const tgl = new Date(t.waktu)
                  return (
                    <span key={t.waktu} style={s.barisTrip}>
                      <span style={{ opacity: 0.65 }}>{String(tgl.getDate()).padStart(2, '0')}/{String(tgl.getMonth() + 1).padStart(2, '0')}</span>
                      <span>{t.kasar ? '±' : ''}{desimal(t.km)}KM · {Math.round(t.menit)}{k.mnt}</span>
                      <span style={{ color: '#FF9A3C' }}>Rp{rupiah(t.rupiah)}</span>
                    </span>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  kepala: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, height: 18 },
  kembali: { background: 'none', border: 'none', color: '#FFFFFF', font: 'inherit', fontSize: 8, letterSpacing: '0.1em', padding: '2px 6px 2px 0', cursor: 'pointer', whiteSpace: 'nowrap' },
  titikRow: { display: 'inline-flex', alignItems: 'center' },
  titikTombol: { background: 'none', border: 'none', padding: '6px 3px', cursor: 'pointer', display: 'flex' },
  titik: { height: 4, display: 'block', transition: 'width 0.2s, background 0.2s' },
  status: { fontSize: 8, letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 },
  viewport: { overflow: 'hidden', marginTop: 4, touchAction: 'pan-y' },
  track: { display: 'flex', width: '200%', transition: 'transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)' },
  halaman: { width: '50%', flexShrink: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 9, height: 48 },
  kiri: { display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, paddingRight: 9, borderRight: '1px solid rgba(94, 208, 255, 0.2)' },
  kanan: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 },
  kecil: { fontSize: 6, letterSpacing: '0.14em', opacity: 0.6, whiteSpace: 'nowrap' },
  angka: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#FFFFFF', whiteSpace: 'nowrap' },
  barBesar: { width: 12, height: 16, padding: 0, border: 'none', borderRadius: 0, cursor: 'pointer', display: 'block' },
  biaya: { fontSize: 8, letterSpacing: '0.06em', color: '#FF9A3C', whiteSpace: 'nowrap' },
  tombol: { fontFamily: 'inherit', fontSize: 7, letterSpacing: '0.08em', whiteSpace: 'nowrap', padding: '5px 6px', color: '#5ED0FF', background: 'transparent', border: '1px solid #5ED0FF', borderRadius: 0, cursor: 'pointer' },
  tombolOranye: { color: '#04192A', background: '#FF9A3C', borderColor: '#FF9A3C' },
  tombolHijau: { color: '#04192A', background: '#4ADE80', borderColor: '#4ADE80' },
  tombolRedup: { color: '#8FB2D0', borderColor: '#8FB2D0' },
  pilihanIsi: { display: 'flex', flexWrap: 'wrap', gap: 3 },
  barisTrip: { display: 'flex', justifyContent: 'space-between', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#FFFFFF', whiteSpace: 'nowrap' },
}
