import { useLanguage } from '../context/LanguageContext.jsx'
import { TARIF_PER_RIDE } from '../lib/constants'
import TampilanLevel from './TampilanLevel.jsx'

const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID')

// Halaman level di konsol ojek, dibuka dengan memencet LV di baris status (seperti halaman cuaca dan bensin).
// Satu layar: LV, total uang dibanding target, garis, lalu tiga angka ringkas (total trip, per trip, sisa trip).
export default function KonsolLevel({ total, totalTrip = null, onKembali }) {
  const { lang } = useLanguage()
  return (
    <div className="tv-nyala">
      <div style={s.kepala}>
        <button type="button" onClick={onKembali} style={s.kembali} aria-label={lang === 'en' ? 'Back' : 'Kembali'}>
          <span aria-hidden="true" style={{ color: '#5ED0FF' }}>◀</span> {lang === 'en' ? 'BACK' : 'KEMBALI'}
        </button>
        <span style={s.judul}>LEVEL</span>
      </div>
      <div style={{ marginTop: 3 }}>
        <TampilanLevel
          total={total ?? 0}
          rapat
          statistik={[
            [totalTrip ?? '--', 'TOTAL TRIPS'],
            ['+' + rp(TARIF_PER_RIDE), 'PER TRIP'],
          ]}
        />
      </div>
    </div>
  )
}

const s = {
  kepala: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 14 },
  kembali: { background: 'none', border: 'none', color: '#FFFFFF', font: 'inherit', fontSize: 8, letterSpacing: '0.1em', padding: '2px 6px 2px 0', cursor: 'pointer', whiteSpace: 'nowrap' },
  judul: { fontSize: 7, letterSpacing: '0.14em', opacity: 0.6 },
}
