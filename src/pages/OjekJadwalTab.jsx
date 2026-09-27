import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import JadwalMingguan from '../components/JadwalMingguan.jsx'

export default function OjekJadwalTab({ jadwalMingguan, onTandaiSelesai, simpanJadwal }) {
  const { t } = useLanguage()
  const { isDemo } = useAuth()
  const [modeAtur, setModeAtur] = useState(false)

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div>
          <div style={s.eyebrow}>{t.jadwalEyebrow}</div>
          <h1 style={s.title}>{isDemo ? t.jadwalTitleOjekDemo : t.jadwalTitleOjek}</h1>
        </div>
        <button style={s.aturBtn} onClick={() => setModeAtur((v) => !v)}>
          {modeAtur ? t.selesaiAturJadwal : t.aturJadwalSendiri}
        </button>
      </header>

      <JadwalMingguan
        jadwal={jadwalMingguan}
        onSimpan={simpanJadwal}
        bisaEdit={modeAtur}
        bisaTandaiSelesai={!modeAtur}
        onTandaiSelesai={onTandaiSelesai}
      />

      <p style={s.catatan}>{isDemo ? t.jadwalCatatanOjekDemo : t.jadwalCatatanOjek}</p>
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
    gap: 10,
  },
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 22,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
  },
  aturBtn: {
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
