import { useRef } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import JadwalMingguan from '../components/JadwalMingguan.jsx'

export default function JadwalTab({ jadwalMingguan, simpanJadwal }) {
  const { t } = useLanguage()
  const jadwalRef = useRef(null)

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div>
          <div style={s.eyebrow}>{t.jadwalEyebrow}</div>
          <h1 style={s.title}>{t.jadwalTitlePenumpang}</h1>
        </div>
        <button style={s.resetBtn} onClick={() => jadwalRef.current?.reset()}>
          {t.resetJadwal}
        </button>
      </header>

      <JadwalMingguan ref={jadwalRef} jadwal={jadwalMingguan} onSimpan={simpanJadwal} bisaEdit />

      <p style={s.catatan}>{t.jadwalCatatanPenumpang}</p>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 24,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
  },
  resetBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: '#8FB4DC',
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
    background: 'var(--card-blue)',
    flexShrink: 0,
  },
  catatan: { fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, textAlign: 'center' },
}
