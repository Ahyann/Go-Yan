import { TARIF_PER_RIDE, formatRupiah } from '../lib/constants'

export default function SetupCheck({ configured }) {
  return (
    <main style={s.wrap}>
      <div style={s.badge}>FASE 0 · PONDASI</div>

      <h1 style={s.title}>
        Go<span style={{ color: 'var(--web-red)' }}>-yan</span>
      </h1>
      <p style={s.sub}>Antar jemput tracker · tarif {formatRupiah(TARIF_PER_RIDE)} per perjalanan</p>

      <div style={s.card}>
        <Row label="React + Vite" ok />
        <Row label="Routing" ok />
        <Row label="Design token" ok />
        <Row
          label="Koneksi Firebase"
          ok={configured}
          hintGagal="Isi file .env dulu, lalu restart npm run dev"
        />
      </div>

      <p style={s.foot}>
        {configured
          ? 'Pondasi siap. Lanjut ke Fase 1: tampilan penumpang & ojek.'
          : 'Salin .env.example jadi .env, isi dari Firebase Console.'}
      </p>
    </main>
  )
}

function Row({ label, ok, hintGagal }) {
  return (
    <div style={s.row}>
      <span
        style={{
          ...s.dot,
          background: ok ? 'var(--signal)' : 'var(--warn)',
        }}
      />
      <div>
        <div>{label}</div>
        {!ok && hintGagal && <div style={s.hint}>{hintGagal}</div>}
      </div>
    </div>
  )
}

const s = {
  wrap: {
    minHeight: '100%',
    padding: `calc(var(--safe-top) + 48px) 20px calc(var(--safe-bottom) + 32px)`,
    maxWidth: 480,
    margin: '0 auto',
  },
  badge: {
    display: 'inline-block',
    fontSize: 11,
    letterSpacing: '0.12em',
    color: 'var(--text-dim)',
    border: '1px solid var(--line)',
    borderRadius: 999,
    padding: '5px 11px',
    marginBottom: 22,
  },
  title: { fontSize: 34, letterSpacing: '-0.02em', marginBottom: 6 },
  sub: { color: 'var(--text-dim)', fontSize: 14, marginBottom: 30 },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: 6,
  },
  row: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: '13px 14px',
    fontSize: 15,
  },
  dot: { width: 8, height: 8, borderRadius: '50%', marginTop: 7, flexShrink: 0 },
  hint: { fontSize: 12.5, color: 'var(--text-dim)', marginTop: 3, lineHeight: 1.45 },
  foot: { color: 'var(--text-dim)', fontSize: 13, marginTop: 22, lineHeight: 1.5 },
}
