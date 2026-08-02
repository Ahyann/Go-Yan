import { dummyJadwal, dummyRiwayat } from '../lib/dummyData'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import JadwalCard from '../components/JadwalCard.jsx'

export default function OjekView() {
  const belumBayar = dummyRiwayat.filter((r) => r.statusBayar === STATUS_BAYAR.BELUM)
  const totalBelumBayar = belumBayar.reduce((jumlah, r) => jumlah + r.tarif, 0)
  const jemputanBerikutnya = dummyJadwal[0]

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>OJEK</div>
        <h1 style={s.title}>Halo, Ahyan</h1>
      </header>

      {jemputanBerikutnya && (
        <section style={s.nextCard}>
          <div style={s.nextLabel}>Jemputan berikutnya</div>
          <div style={s.nextJam}>{jemputanBerikutnya.jam}</div>
          <div style={s.nextCatatan}>{jemputanBerikutnya.catatan || 'Tanpa catatan'}</div>
          <button style={s.mulaiBtn}>Mulai jemput</button>
        </section>
      )}

      <section>
        <h2 style={s.sectionTitle}>Semua jadwal</h2>
        <div style={s.list}>
          {dummyJadwal.map((j) => (
            <JadwalCard key={j.id} tanggal={j.tanggal} jam={j.jam} catatan={j.catatan} />
          ))}
        </div>
      </section>

      <section style={s.tagihanCard}>
        <div style={s.tagihanLabel}>Belum ditransfer sepupu</div>
        <div style={s.tagihanAngka}>{formatRupiah(totalBelumBayar)}</div>
        <div style={s.tagihanSub}>{belumBayar.length} perjalanan</div>
      </section>
    </main>
  )
}

const s = {
  wrap: {
    minHeight: '100%',
    padding: 'calc(var(--safe-top) + 24px) 20px calc(var(--safe-bottom) + 32px)',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  header: {},
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: { fontSize: 26, letterSpacing: '-0.01em' },
  nextCard: {
    background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
    border: '1px solid var(--web-red)',
    borderRadius: 'var(--radius)',
    padding: 20,
  },
  nextLabel: { fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 },
  nextJam: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' },
  nextCatatan: { fontSize: 14, color: 'var(--text-dim)', marginTop: 4, marginBottom: 16 },
  mulaiBtn: {
    width: '100%',
    background: 'var(--web-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },
  sectionTitle: { fontSize: 14, color: 'var(--text-dim)', marginBottom: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  tagihanCard: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: 20,
  },
  tagihanLabel: { fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 },
  tagihanAngka: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' },
  tagihanSub: { fontSize: 13, color: 'var(--text-dim)', marginTop: 4 },
}