import { useLanguage } from '../context/LanguageContext.jsx'
import JadwalMingguan from '../components/JadwalMingguan.jsx'

export default function OjekJadwalTab({ jadwalMingguan }) {
  const { t } = useLanguage()
  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>{t.jadwalEyebrow}</div>
        <h1 style={s.title}>{t.jadwalTitleOjek}</h1>
      </header>

      <JadwalMingguan jadwal={jadwalMingguan} bisaEdit={false} />

      <p style={s.catatan}>{t.jadwalCatatanOjek}</p>
    </main>
  )
}

const s = {
  wrap: {
    minHeight: '100%',
    padding: 'calc(var(--safe-top) + 24px) 20px 110px',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {},
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 22,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
  },
  catatan: { fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, textAlign: 'center' },
}
