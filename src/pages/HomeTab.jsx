import PetaStatus from '../components/PetaStatus.jsx'

export default function HomeTab({ permintaan }) {
  return (
    <div style={s.wrap}>
      <div style={s.headerFloat}>
        <div style={s.eyebrow}>PENUMPANG</div>
        <h1 style={s.title}>Halo, Fajri</h1>
      </div>

      <PetaStatus permintaan={permintaan} />
    </div>
  )
}

const s = {
  wrap: {
    position: 'relative',
    height: '100%',
    maxWidth: 480,
    margin: '0 auto',
    overflow: 'hidden',
  },
  headerFloat: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 16px)',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  eyebrow: {
    fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4,
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },
  title: {
    fontSize: 26, letterSpacing: '-0.01em',
    textShadow: '0 1px 6px rgba(0,0,0,0.8)',
  },
}