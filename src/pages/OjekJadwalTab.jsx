import JadwalMingguan from '../components/JadwalMingguan.jsx'

export default function OjekJadwalTab({ jadwalMingguan }) {
  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>JADWAL</div>
        <h1 style={s.title}>Jadwal mingguan Fajri</h1>
      </header>

      <JadwalMingguan jadwal={jadwalMingguan} bisaEdit={false} />

      <p style={s.catatan}>
        Jadwal ini otomatis kosong lagi tiap awal minggu (Senin), nunggu Fajri atur ulang.
      </p>
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