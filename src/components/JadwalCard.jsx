export default function JadwalCard({ tanggal, jam, catatan }) {
  const tgl = new Date(tanggal + 'T00:00:00')
  const hari = tgl.toLocaleDateString('id-ID', { weekday: 'long' })
  const tglFormat = tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

  return (
    <div style={s.card}>
      <div style={s.jam}>{jam}</div>
      <div style={s.info}>
        <div style={s.hari}>{hari}, {tglFormat}</div>
        {catatan && <div style={s.catatan}>{catatan}</div>}
      </div>
    </div>
  )
}

const s = {
  card: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px',
  },
  jam: {
    fontSize: 17,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 52,
  },
  info: { display: 'flex', flexDirection: 'column', gap: 2 },
  hari: { fontSize: 14.5 },
  catatan: { fontSize: 13, color: 'var(--text-dim)' },
}