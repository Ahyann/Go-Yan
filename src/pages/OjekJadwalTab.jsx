import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import JadwalMingguan from '../components/JadwalMingguan.jsx'
import KonsolJadwal from '../components/KonsolJadwal.jsx'

// ikon piksel 8 x 8
const IKON_PENSIL = 'M5 0h2v1h1v2H7V2H6V1H5zM4 1h1v1h1v1h1v1H6v1H5v1H4v1H3v1H0V5h1V4h1V3h1V2h1z'
const IKON_CENTANG = 'M7 1h1v2H7v1H6v1H5v1H4v1H3V6H2V5H1V4H0V3h2v1h1v1h1V4h1V3h1V2h1z'

export default function OjekJadwalTab({ jadwalMingguan, onTandaiSelesai, simpanJadwal, slotKonsol, konsolSendiri = true, tvNyala = false }) {
  const { t } = useLanguage()
  const { isDemo } = useAuth()
  const [modeAtur, setModeAtur] = useState(false)
  const [hariBaru, setHariBaru] = useState(null)
  const [sedangIsi, setSedangIsi] = useState(false)
  const jadwalRef = useRef(null)
  // Jadwal sudah terisi kalau ada satu slot yang aktif; kosong lagi setelah direset tiap Senin
  const jadwalAda = Object.values(jadwalMingguan || {}).some((h) => h?.antar?.aktif || h?.jemput?.aktif)

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.barisAtas}>
          <div style={s.eyebrow}>{t.jadwalEyebrow}</div>
          <button type="button" className={modeAtur ? 'tombol-siku aktif' : 'tombol-siku'} onClick={() => setModeAtur((v) => !v)}>
            <svg width="12" height="12" viewBox="0 0 8 8" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
              <path d={modeAtur ? IKON_CENTANG : IKON_PENSIL} />
            </svg>
            {modeAtur ? t.selesaiAturJadwal : t.aturJadwalSendiri}
            {['a', 'b', 'c', 'd'].map((k) => <i key={k} aria-hidden="true" />)}
          </button>
        </div>
        {/* judul memakai lebar penuh supaya tidak terpotong jadi tiga baris di layar HP */}
        <h1 style={s.title}>{isDemo ? t.jadwalTitleOjekDemo : t.jadwalTitleOjek}</h1>
      </header>

      <JadwalMingguan
        ref={jadwalRef}
        hariBaru={hariBaru}
        tahanSinkron={sedangIsi}
        jadwal={jadwalMingguan}
        onSimpan={async (d) => { await simpanJadwal(d); setModeAtur(false) }} // simpan manual juga kembali ke tampilan kartu, sama seperti hasil isi lewat konsol
        bisaEdit={modeAtur}
        bisaTandaiSelesai={!modeAtur}
        onTandaiSelesai={onTandaiSelesai}
      />

      <p style={s.catatan}>{isDemo ? t.jadwalCatatanOjekDemo : t.jadwalCatatanOjek}</p>

      {slotKonsol && konsolSendiri && createPortal(<div className={tvNyala ? 'tv-nyala' : undefined}><KonsolJadwal jadwalRef={jadwalRef} onHariBaru={setHariBaru} onMasukAtur={() => setModeAtur(true)} onSelesaiIsi={() => setModeAtur(false)} onSedangIsi={setSedangIsi} jadwalAda={jadwalAda} onSimpan={simpanJadwal} /></div>, slotKonsol)}
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
  header: { display: 'flex', flexDirection: 'column', gap: 6 },
  barisAtas: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)' },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 22,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
    textWrap: 'balance',
  },
  catatan: { fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, textAlign: 'center' },
}
