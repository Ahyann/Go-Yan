import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { TEKS_STATUS, jenisCuaca, useStatusSiaga } from '../lib/statusSiaga'
import { IkonCuaca } from './BarisStatusSiaga.jsx'

const TEKS = {
  id: { stJas: 'BAWA JAS HUJAN', jamS: 'J', menitS: 'M', kini: 'SEKARANG', stPanas: 'PANAS, BAWA MINUM', stAman: 'AMAN', kembali: 'KEMBALI', hujan: 'HUJAN ± ', cerah: 'TANPA HUJAN', kosong: 'NYALAKAN LOKASI UNTUK PRAKIRAAN', lokasi: 'LOKASIMU', jemput: 'JEMPUT', antar: 'ANTAR' },
  en: { stJas: 'WEAR A RAINCOAT', jamS: 'H', menitS: 'M', kini: 'NOW', stPanas: 'HOT, DRINK UP', stAman: 'ALL CLEAR', kembali: 'BACK', hujan: 'RAIN ~ ', cerah: 'NO RAIN', kosong: 'TURN ON LOCATION FOR FORECAST', lokasi: 'YOUR AREA', jemput: 'PICKUP', antar: 'DROP-OFF' },
}
const AMBANG_HUJAN = 50 // persen peluang hujan yang dianggap "akan hujan"
const HARI = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
const MERAH = '#ED1C24'
const BATAS_PANAS = 32 // derajat Celsius yang dianggap panas sekali

// Emote piksel untuk status di tengah kepala halaman
function EmoteStatus({ jenis }) {
  const p = { width: 13, height: 13, viewBox: '0 0 12 12', shapeRendering: 'crispEdges', 'aria-hidden': true, style: { flexShrink: 0, display: 'block' } }
  if (jenis === 'jas') {
    return (
      <svg {...p} className="ik-denyut">
        <g fill="#FFD84A"><rect x="4" y="0" width="4" height="1" /><rect x="3" y="1" width="6" height="2" /><rect x="2" y="3" width="8" height="8" /><rect x="1" y="4" width="1" height="5" /><rect x="10" y="4" width="1" height="5" /></g>
        <g fill="#04192A"><rect x="5" y="2" width="2" height="1" /><rect x="6" y="5" width="1" height="1" /><rect x="6" y="8" width="1" height="1" /></g>
        <g fill="#5ED0FF"><rect className="ik-tetes" x="0" y="0" width="1" height="2" /><rect className="ik-tetes" style={{ animationDelay: '0.4s' }} x="11" y="1" width="1" height="2" /></g>
      </svg>
    )
  }
  if (jenis === 'panas') {
    return (
      <svg {...p}>
        <rect x="5" y="0" width="2" height="1" fill="#FFFFFF" />
        <rect x="5" y="1" width="2" height="2" fill="#9FD9F5" />
        <rect x="3" y="3" width="6" height="9" fill="#9FD9F5" />
        <rect x="4" y="6" width="4" height="5" fill="#5ED0FF" className="ik-denyut" />
      </svg>
    )
  }
  return (
    <svg {...p}>
      <g fill="#4ADE80"><rect x="1" y="6" width="2" height="2" /><rect x="3" y="8" width="2" height="2" /><rect x="5" y="6" width="2" height="2" /><rect x="7" y="4" width="2" height="2" /><rect x="9" y="2" width="2" height="2" /></g>
    </svg>
  )
}

// Jadwal ojek yang sudah diisi (jemput/antar) untuk satu jam prakiraan: kembalian [{ jenis: 'jemput' | 'antar', jam: 'HH:MM' }]
function acaraJam(jadwal, j) {
  if (!jadwal || !j.tgl) return []
  const h = jadwal[HARI[new Date(`${j.tgl}T12:00:00`).getDay()]]
  if (!h) return []
  const hasil = []
  for (const jenis of ['jemput', 'antar']) {
    const a = h[jenis]
    if (a?.aktif && a.jam && a.jam.slice(0, 2) === j.w.slice(0, 2)) hasil.push({ jenis, jam: a.jam })
  }
  return hasil
}

// Halaman prakiraan cuaca di layar konsol ojek: cuaca sekarang besar di kiri beserta nama tempat, jam-jam berikutnya di kanan
// (bisa digeser). Jam yang cocok dengan jadwal jemput/antar yang sudah diisi ditandai merah, dan ringkasannya di kanan atas.
export default function KonsolCuaca({ onKembali, lokasiAktif = false, jadwal = null }) {
  const { lang } = useLanguage()
  const k = TEKS[lang] || TEKS.id
  const kode = (TEKS_STATUS[lang] || TEKS_STATUS.id).kode
  const { cuaca } = useStatusSiaga(lokasiAktif)
  const jam = cuaca?.jam || []
  const berikut = jam.slice(1)
  const tanda = berikut.map((j) => acaraJam(jadwal, j))
  const idxJadwal = tanda.findIndex((t) => t.length > 0)
  const jenisSkrg = cuaca ? jenisCuaca(cuaca.kode) : 'mendung'
  const [sekarang, setSekarang] = useState(() => Date.now())
  const gulirRef = useRef(null)

  // Hitung mundur ke jadwal diperbarui tiap 30 detik
  useEffect(() => {
    const id = setInterval(() => setSekarang(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  // Deretan jam otomatis digeser supaya kolom jadwal terdekat langsung kelihatan
  useEffect(() => {
    const g = gulirRef.current
    if (!g || idxJadwal < 0) return
    const sel = g.children[idxJadwal]
    if (sel) g.scrollLeft = Math.max(0, sel.offsetLeft - g.offsetLeft - 44)
  }, [idxJadwal, jam.length])

  // Status tengah: cuaca di jam jadwal terdekat (kalau ada), kalau tidak cuaca sekarang
  const sasaran = idxJadwal >= 0 ? berikut[idxJadwal] : jam[0]
  let status = null
  if (sasaran) {
    const jn = jenisCuaca(sasaran.kode)
    if (jn === 'gerimis' || jn === 'hujan' || jn === 'petir' || sasaran.hujan >= AMBANG_HUJAN) status = { jenis: 'jas', teks: k.stJas, warna: '#5ED0FF' }
    else if (sasaran.suhu >= BATAS_PANAS) status = { jenis: 'panas', teks: k.stPanas, warna: '#FFD84A' }
    else status = { jenis: 'aman', teks: k.stAman, warna: '#4ADE80' }
  }

  let ringkas = ''
  let warnaRingkas = '#4ADE80'
  if (idxJadwal >= 0) {
    const a = tanda[idxJadwal][0]
    const sisa = new Date(`${berikut[idxJadwal].tgl}T${a.jam}:00`).getTime() - sekarang
    const jm = Math.floor(sisa / 3600000)
    const mn = Math.floor((sisa % 3600000) / 60000)
    ringkas = `${k[a.jenis]} ${sisa <= 0 ? k.kini : jm > 0 ? `${jm}${k.jamS} ${mn}${k.menitS}` : `${mn}${k.menitS}`}`
    warnaRingkas = '#FF7A85'
  } else if (jam.length) {
    const jamHujan = jam.find((j) => j.hujan >= AMBANG_HUJAN)
    ringkas = jamHujan ? `${k.hujan}${jamHujan.w}` : k.cerah
    warnaRingkas = jamHujan ? '#5ED0FF' : '#4ADE80'
  }

  return (
    <div className="tv-nyala">
      <div style={s.kepala}>
        <button type="button" onClick={onKembali} style={s.kembali} aria-label={k.kembali}>
          <span aria-hidden="true" style={{ color: '#5ED0FF' }}>◀</span> {k.kembali}
        </button>
        {status && (
          <span style={{ ...s.status, color: status.warna }}>
            <EmoteStatus jenis={status.jenis} />
            <span style={s.statusTeks}>{status.teks}</span>
          </span>
        )}
        <span style={{ ...s.ringkas, color: warnaRingkas }}>{ringkas}</span>
      </div>
      {jam.length === 0 ? (
        <div style={s.kosong}>{k.kosong}</div>
      ) : (
        <div style={s.badan}>
          <div style={s.kiri}>
            <IkonCuaca jenis={jenisSkrg} />
            <span style={s.kiriTeks}>
              <span style={s.suhuBesar}>{cuaca.suhu}°</span>
              <span style={s.kondisi}>{kode[jenisSkrg]}</span>
              <span style={s.tempat}>{cuaca.nama || k.lokasi}</span>
            </span>
          </div>
          <div ref={gulirRef} className="gulir-sembunyi" style={s.gulir} role="list" aria-label={lang === 'en' ? 'Next hours, swipe sideways' : 'Jam berikutnya, geser ke samping'}>
            {berikut.map((j, i) => {
              const jenis = jenisCuaca(j.kode)
              const hujan = j.hujan >= AMBANG_HUJAN
              const acara = tanda[i][0]
              return (
                <div
                  key={j.tgl + j.w}
                  role="listitem"
                  aria-label={`${j.w} ${j.suhu}° ${kode[jenis]} ${j.hujan}%${acara ? ` ${k[acara.jenis]} ${acara.jam}` : ''}`}
                  style={{ ...s.sel, borderTopColor: acara ? MERAH : 'transparent', borderBottomColor: hujan ? '#5ED0FF' : 'transparent' }}
                >
                  <span style={s.penanda}>{acara ? k[acara.jenis] : ' '}</span>
                  <span style={{ ...s.waktu, color: acara ? '#FF7A85' : undefined }}>{j.w}</span>
                  <IkonCuaca jenis={jenis} />
                  <span style={s.baris3}>
                    <span style={s.suhu}>{j.suhu}°</span>
                    <span style={{ ...s.persen, color: hujan ? '#5ED0FF' : undefined, opacity: hujan ? 1 : 0.5 }}>{j.hujan}%</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  kepala: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 18 },
  status: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 8, letterSpacing: '0.08em', minWidth: 0, flex: '0 1 auto' },
  statusTeks: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  kembali: { background: 'none', border: 'none', color: '#FFFFFF', font: 'inherit', fontSize: 9, letterSpacing: '0.1em', padding: '2px 6px 2px 0', cursor: 'pointer', whiteSpace: 'nowrap' },
  ringkas: { fontSize: 9, letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 },
  badan: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, height: 46 },
  kiri: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingRight: 8, borderRight: '1px solid rgba(94, 208, 255, 0.2)', maxWidth: 128 },
  kiriTeks: { display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 },
  suhuBesar: { fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: '#FFFFFF' },
  kondisi: { fontSize: 7, letterSpacing: '0.14em', opacity: 0.65, whiteSpace: 'nowrap' },
  tempat: { fontSize: 7, letterSpacing: '0.1em', color: '#5ED0FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 94 },
  gulir: { flex: 1, minWidth: 0, display: 'flex', gap: 2, overflowX: 'auto', touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', WebkitMaskImage: 'linear-gradient(90deg, #000 82%, transparent)', maskImage: 'linear-gradient(90deg, #000 82%, transparent)' },
  sel: { flex: '0 0 42px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '1px 0', borderTop: '2px solid transparent', borderBottom: '2px solid transparent' },
  penanda: { fontSize: 6, letterSpacing: '0.1em', color: '#FF7A85', whiteSpace: 'nowrap', lineHeight: 1 },
  waktu: { fontSize: 7, letterSpacing: '0.06em', opacity: 0.8 },
  baris3: { display: 'flex', alignItems: 'baseline', gap: 2 },
  suhu: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#FFFFFF' },
  persen: { fontSize: 6, letterSpacing: '0.04em' },
  kosong: { fontSize: 9, letterSpacing: '0.08em', opacity: 0.7, textAlign: 'center', marginTop: 18 },
}
