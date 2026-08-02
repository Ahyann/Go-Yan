import { dummyJadwal, dummyRiwayat } from '../lib/dummyData'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import JadwalCard from '../components/JadwalCard.jsx'

export default function PenumpangView() {
  const belumBayar = dummyRiwayat.filter((r) => r.statusBayar === STATUS_BAYAR.BELUM)
  const totalBelumBayar = belumBayar.reduce((jumlah, r) => jumlah + r.tarif, 0)

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>PENUMPANG</div>
        <h1 style={s.title}>Halo, Fajri</h1>
      </header>

      <section style={s.tagihanCard}>
        <div style={s.tagihanLabel}>Belum ditransfer</div>
        <div style={s.tagihanAngka}>{formatRupiah(totalBelumBayar)}</div>
        <div style={s.tagihanSub}>{belumBayar.length} perjalanan</div>
      </section>

      <section>
        <h2 style={s.sectionTitle}>Jadwal mendatang</h2>
        <div style={s.list}>
          {dummyJadwal.map((j) => (
            <JadwalCard key={j.id} tanggal={j.tanggal} jam={j.jam} catatan={j.catatan} />
          ))}
        </div>
      </section>

      <button style={s.fab}>+ Buat jadwal</button>
    </main>
  )
}

const s = {
  wrap: {
    minHeight: '100%',
    padding: 'calc(var(--safe-top) + 24px) 20px calc(var(--safe-bottom) + 100px)',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  header: {},
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: { fontSize: 26, letterSpacing: '-0.01em' },
  tagihanCard: {
    background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: 20,
  },
  tagihanLabel: { fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 },
  tagihanAngka: { fontSize: 32, fontWeight: 700, color: 'var(--web-red)', letterSpacing: '-0.02em' },
  tagihanSub: { fontSize: 13, color: 'var(--text-dim)', marginTop: 4 },
  sectionTitle: { fontSize: 14, color: 'var(--text-dim)', marginBottom: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  fab: {
    position: 'fixed',
    bottom: 'calc(var(--safe-bottom) + 20px)',
    left: 20,
    right: 20,
    maxWidth: 440,
    margin: '0 auto',
    background: 'var(--web-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '15px',
    borderRadius: 999,
  },
}