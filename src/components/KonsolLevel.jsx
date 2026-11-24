import { useLanguage } from '../context/LanguageContext.jsx'
import TampilanLevel from './TampilanLevel.jsx'

// Halaman level di konsol ojek, dibuka dengan memencet TOTAL TRIPS di baris status (seperti halaman cuaca dan bensin)
export default function KonsolLevel({ total, onKembali }) {
  const { lang } = useLanguage()
  return (
    <div className="tv-nyala">
      <div style={s.kepala}>
        <button type="button" onClick={onKembali} style={s.kembali} aria-label={lang === 'en' ? 'Back' : 'Kembali'}>
          <span aria-hidden="true" style={{ color: '#5ED0FF' }}>◀</span> {lang === 'en' ? 'BACK' : 'KEMBALI'}
        </button>
        <span style={s.judul}>LEVEL</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <TampilanLevel total={total ?? 0} />
      </div>
    </div>
  )
}

const s = {
  kepala: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 18 },
  kembali: { background: 'none', border: 'none', color: '#FFFFFF', font: 'inherit', fontSize: 8, letterSpacing: '0.1em', padding: '2px 6px 2px 0', cursor: 'pointer', whiteSpace: 'nowrap' },
  judul: { fontSize: 8, letterSpacing: '0.14em', opacity: 0.6 },
}
