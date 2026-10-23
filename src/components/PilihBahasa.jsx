import { useLanguage } from '../context/LanguageContext.jsx'

// Pilihan bahasa kecil (ID | EN) berbentuk pil. Dipakai di halaman login dan di
// tab Akun, jadi bentuknya selalu sama. `style` buat ngatur posisinya.
export default function PilihBahasa({ style }) {
  const { t, lang, setLang } = useLanguage()

  return (
    <div style={{ ...s.pil, ...style }} role="group" aria-label={t.bahasaLabel}>
      {['id', 'en'].map((kode) => (
        <button
          key={kode}
          type="button"
          style={lang === kode ? s.btnAktif : s.btn}
          onClick={() => setLang(kode)}
          aria-pressed={lang === kode}
        >
          {kode.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

const s = {
  pil: {
    display: 'flex',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 999,
    padding: 2,
  },
  btn: {
    minWidth: 34,
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: '#8FB4DC',
    padding: '5px 9px',
    borderRadius: 999,
  },
  btnAktif: {
    minWidth: 34,
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: 'var(--glow-blue)',
    background: 'rgba(94,208,255,0.18)',
    boxShadow: '0 0 6px rgba(94,208,255,0.35)',
    padding: '5px 9px',
    borderRadius: 999,
  },
}
