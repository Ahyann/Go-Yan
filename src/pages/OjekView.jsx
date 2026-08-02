import { dummyJadwal, dummyRiwayat } from '../lib/dummyData'
import { STATUS_BAYAR, STATUS_PERMINTAAN, AKSI, formatRupiah } from '../lib/constants'
import JadwalCard from '../components/JadwalCard.jsx'

export default function OjekView({ permintaan, onTerima }) {
  const belumBayar = dummyRiwayat.filter((r) => r.statusBayar === STATUS_BAYAR.BELUM)
  const totalBelumBayar = belumBayar.reduce((jumlah, r) => jumlah + r.tarif, 0)
  const jemputanBerikutnya = dummyJadwal[0]

  const adaPermintaanMasuk = permintaan?.status === STATUS_PERMINTAAN.MENUNGGU
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>OJEK</div>
        <h1 style={s.title}>Halo, Ahyan</h1>
      </header>

      {adaPermintaanMasuk && (
        <section style={s.permintaanCard}>
          <div style={s.permintaanLabel}>Permintaan baru dari Fajri</div>
          <div style={s.permintaanAksi}>
            {permintaan.aksi === AKSI.JEMPUT ? 'Jemput' : 'Antar'} · {permintaan.waktu}
          </div>
          <div style={s.permintaanWhere}>{permintaan.where}</div>
          <button style={s.terimaBtn} onClick={onTerima}>
            Terima
          </button>
        </section>
      )}

      {sedangJalan && (
        <section style={s.jalanCard}>
          <span style={s.dotHijau} />
          Sedang {permintaan.aksi === AKSI.JEMPUT ? 'menjemput' : 'mengantar'} Fajri · {permintaan.where}
        </section>
      )}

      {!adaPermintaanMasuk && !sedangJalan && jemputanBerikutnya && (
        <section style={s.nextCard}>
          <div style={s.nextLabel}>Jemputan berikutnya</div>
          <div style={s.nextJam}>{jemputanBerikutnya.jam}</div>
          <div style={s.nextCatatan}>{jemputanBerikutnya.catatan || 'Tanpa catatan'}</div>
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
    gap: 24,
  },
  header: {},
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: { fontSize: 26, letterSpacing: '-0.01em' },

  permintaanCard: {
    background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
    border: '1px solid var(--warn)',
    borderRadius: 'var(--radius)',
    padding: 20,
  },
  permintaanLabel: { fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 },
  permintaanAksi: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' },
  permintaanWhere: { fontSize: 14.5, color: 'var(--text-dim)', marginTop: 4, marginBottom: 16 },
  terimaBtn: {
    width: '100%',
    background: 'var(--web-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },

  jalanCard: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--signal)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px',
    fontSize: 14.5,
    fontWeight: 600,
  },
  dotHijau: { width: 7, height: 7, borderRadius: '50%', background: 'var(--signal)', display: 'inline-block', marginRight: 8 },

  nextCard: {
    background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: 20,
  },
  nextLabel: { fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 },
  nextJam: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' },
  nextCatatan: { fontSize: 14, color: 'var(--text-dim)', marginTop: 4 },

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