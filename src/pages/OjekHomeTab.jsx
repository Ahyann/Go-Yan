import { STATUS_PERMINTAAN, AKSI } from '../lib/constants'
import { playSpiderSound } from '../lib/sound'

export default function OjekHomeTab({ permintaan, onTerima, onTolak, onSelesai }) {
  const adaPermintaanMasuk = permintaan?.status === STATUS_PERMINTAAN.MENUNGGU
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA

  function handleTerima() {
    playSpiderSound()
    onTerima()
  }

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
          <div style={s.tombolRow}>
            <button style={s.tolakBtn} onClick={onTolak}>Tolak</button>
            <button style={s.terimaBtn} onClick={handleTerima}>Terima</button>
          </div>
        </section>
      )}

      {sedangJalan && (
        <section style={s.jalanCard}>
          <div style={s.jalanRow}>
            <span style={s.dotHijau} />
            Sedang {permintaan.aksi === AKSI.JEMPUT ? 'menjemput' : 'mengantar'} Fajri · {permintaan.where}
          </div>
          <button style={s.selesaiBtn} onClick={onSelesai}>
            Selesai
          </button>
        </section>
      )}

      {!adaPermintaanMasuk && !sedangJalan && (
        <section style={s.idleCard}>Belum ada permintaan masuk.</section>
      )}
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
  tombolRow: { display: 'flex', gap: 10 },
  tolakBtn: {
    flex: 1,
    background: 'var(--surface-2)',
    color: 'var(--text-dim)',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
    border: '1px solid var(--line)',
  },
  terimaBtn: {
    flex: 1,
    background: 'var(--web-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },

  jalanCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    background: 'var(--surface)',
    border: '1px solid var(--signal)',
    borderRadius: 'var(--radius)',
    padding: '16px',
  },
  jalanRow: { display: 'flex', alignItems: 'center', fontSize: 14.5, fontWeight: 600 },
  dotHijau: { width: 7, height: 7, borderRadius: '50%', background: 'var(--signal)', display: 'inline-block', marginRight: 8 },
  selesaiBtn: {
    background: 'var(--signal)',
    color: '#08130d',
    fontSize: 15,
    fontWeight: 700,
    padding: '13px',
    borderRadius: 999,
  },

  idleCard: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: 20,
    color: 'var(--text-dim)',
    fontSize: 14,
    textAlign: 'center',
  },
}