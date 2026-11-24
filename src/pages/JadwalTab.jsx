import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import JadwalMingguan from '../components/JadwalMingguan.jsx'

export default function JadwalTab({ jadwalMingguan, simpanJadwal }) {
  const { t } = useLanguage()
  const jadwalRef = useRef(null)
  // Jadwal yang sudah terisi tampil sebagai kartu; mengisi/mengubah memakai daftar ringkas satu layar
  const [modeIsi, setModeIsi] = useState(null)
  const jadwalAda = Object.values(jadwalMingguan || {}).some((h) => h?.antar?.aktif || h?.jemput?.aktif)
  useEffect(() => {
    if (modeIsi === null && jadwalMingguan) setModeIsi(!jadwalAda)
  }, [jadwalMingguan, jadwalAda, modeIsi])
  const mengisi = modeIsi !== false

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div>
          <div style={s.eyebrow}>{t.jadwalEyebrow}</div>
          <h1 style={s.title}>{t.jadwalTitlePenumpang}</h1>
        </div>
        <button className="tekan" style={s.resetBtn} onClick={() => (mengisi ? jadwalRef.current?.reset() : setModeIsi(true))}>
          {mengisi ? t.resetJadwal : t.ubahJadwal}
        </button>
      </header>

      <JadwalMingguan
        ref={jadwalRef}
        jadwal={jadwalMingguan}
        onSimpan={async (d) => { await simpanJadwal(d); if (Object.values(d).some((h) => h?.antar?.aktif || h?.jemput?.aktif)) setModeIsi(false) }}
        bisaEdit={mengisi}
      />

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
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--glow-blue)',
    padding: '0 2px',
    minHeight: 44,
    flexShrink: 0,
  },
  catatan: { fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, textAlign: 'center' },
}
