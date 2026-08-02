import { dummyJadwal } from '../lib/dummyData'
import JadwalCard from '../components/JadwalCard.jsx'

export default function OjekJadwalTab() {
  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>JADWAL</div>
        <h1 style={s.title}>Rencana ke depan</h1>
      </header>

      <div style={s.list}>
        {dummyJadwal.length === 0 ? (
          <div style={s.kosong}>Belum ada jadwal.</div>
        ) : (
          dummyJadwal.map((j) => (
            <JadwalCard key={j.id} tanggal={j.tanggal} jam={j.jam} catatan={j.catatan} />
          ))
        )}
      </div>
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
  title: { fontSize: 26, letterSpacing: '-0.01em' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  kosong: { fontSize: 13.5, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' },
}