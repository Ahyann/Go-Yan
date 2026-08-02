export default function OjekNav({ tabAktif, onTabChange }) {
  return (
    <nav style={s.nav}>
      <IconBtn label="Home" aktif={tabAktif === 'home'} onClick={() => onTabChange('home')}>
        <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
      </IconBtn>
      <IconBtn label="Jadwal" aktif={tabAktif === 'jadwal'} onClick={() => onTabChange('jadwal')}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </IconBtn>
      <IconBtn label="Riwayat" aktif={tabAktif === 'riwayat'} onClick={() => onTabChange('riwayat')}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </IconBtn>
    </nav>
  )
}

function IconBtn({ label, aktif, onClick, children }) {
  return (
    <button style={aktif ? s.iconBtnAktif : s.iconBtn} onClick={onClick} aria-label={label}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      <span style={s.label}>{label}</span>
    </button>
  )
}

const s = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 480,
    margin: '0 auto',
    background: 'var(--surface)',
    borderTop: '1px solid var(--line)',
    padding: '10px 20px calc(var(--safe-bottom) + 8px)',
    display: 'flex',
    justifyContent: 'space-around',
    zIndex: 1000,
  },
  iconBtn: {
    color: 'var(--text-dim)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  iconBtnAktif: {
    color: 'var(--web-red)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  label: { fontSize: 10.5 },
}