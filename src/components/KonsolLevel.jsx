import { useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { hitungLevel, uangPerLevel } from '../lib/level'
import { TARIF_PER_RIDE } from '../lib/constants'
import { playGeserTik } from '../lib/sound'
import TampilanLevel from './TampilanLevel.jsx'

const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID')

// Halaman level di konsol ojek, dibuka dengan memencet LV di baris status (seperti halaman cuaca dan bensin).
// Dua halaman: 1) level, total uang, garis, sisa ke level berikutnya; 2) ringkasan angka (total trip, total uang,
// tarif per trip, level, target, sisa trip). Pindah halaman lewat titik di kepala atau geser kiri/kanan.
export default function KonsolLevel({ total, totalTrip = null, onKembali }) {
  const { lang } = useLanguage()
  const { isDemo } = useAuth()
  const [halaman, setHalaman] = useState(0)
  const awalSentuh = useRef(null)
  const lv = hitungLevel(total ?? 0, uangPerLevel(isDemo))
  const nama = lang === 'en' ? ['Level', 'Stats'] : ['Level', 'Ringkasan']

  function pindah(i) {
    if (i === halaman || i < 0 || i > 1) return
    setHalaman(i)
    playGeserTik(i)
  }

  const stat = (nilai, label) => (
    <span style={s.stat}>
      <span style={s.angka}>{nilai}</span>
      <span style={s.kecil}>{label}</span>
    </span>
  )

  return (
    <div className="tv-nyala">
      <div style={s.kepala}>
        <button type="button" onClick={onKembali} style={s.kembali} aria-label={lang === 'en' ? 'Back' : 'Kembali'}>
          <span aria-hidden="true" style={{ color: '#5ED0FF' }}>◀</span> {lang === 'en' ? 'BACK' : 'KEMBALI'}
        </button>
        <span style={s.titikRow} role="tablist">
          {nama.map((n, i) => (
            <button key={n} type="button" role="tab" aria-selected={halaman === i} aria-label={n} onClick={() => pindah(i)} style={s.titikTombol}>
              <i style={{ ...s.titik, width: halaman === i ? 12 : 5, background: halaman === i ? '#5ED0FF' : '#3F566E' }} />
            </button>
          ))}
        </span>
        <span style={s.judul}>{nama[halaman].toUpperCase()}</span>
      </div>

      <div
        style={s.viewport}
        onTouchStart={(e) => { awalSentuh.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (awalSentuh.current == null) return
          const dx = e.changedTouches[0].clientX - awalSentuh.current
          awalSentuh.current = null
          if (Math.abs(dx) > 40) pindah(halaman + (dx < 0 ? 1 : -1))
        }}
      >
        <div style={{ ...s.track, transform: `translateX(-${halaman * 50}%)` }}>
          <div style={s.halaman}>
            <TampilanLevel total={total ?? 0} rapat />
          </div>
          <div style={{ ...s.halaman, ...s.grid }}>
            {stat(totalTrip ?? '--', 'TOTAL TRIPS')}
            {stat(rp(total ?? 0), lang === 'en' ? 'TOTAL EARNED' : 'TOTAL DAPAT')}
            {stat('+' + rp(TARIF_PER_RIDE), 'PER TRIP')}
            {stat(`LV ${lv.level}`, lang === 'en' ? 'LEVEL NOW' : 'LEVEL SEKARANG')}
            {stat(rp(lv.target), `TARGET LV ${lv.level + 1}`)}
            {stat(lv.sisaTrip, lang === 'en' ? 'TRIPS LEFT' : 'SISA TRIP')}
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  kepala: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 14 },
  kembali: { background: 'none', border: 'none', color: '#FFFFFF', font: 'inherit', fontSize: 8, letterSpacing: '0.1em', padding: '2px 6px 2px 0', cursor: 'pointer', whiteSpace: 'nowrap' },
  titikRow: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'inline-flex', alignItems: 'center' },
  titikTombol: { background: 'none', border: 'none', padding: '6px 3px', cursor: 'pointer', display: 'flex' },
  titik: { height: 4, display: 'block', transition: 'width 0.2s, background 0.2s' },
  judul: { fontSize: 7, letterSpacing: '0.14em', opacity: 0.6 },
  viewport: { overflow: 'hidden', marginTop: 4, touchAction: 'pan-y' },
  track: { display: 'flex', width: '200%', transition: 'transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)' },
  halaman: { width: '50%', flexShrink: 0, boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '7px 6px', paddingTop: 2 },
  stat: { display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 },
  angka: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  kecil: { fontSize: 6, letterSpacing: '0.14em', opacity: 0.6, whiteSpace: 'nowrap' },
}
