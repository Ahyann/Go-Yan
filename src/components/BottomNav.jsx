export default function BottomNav({ tabAktif, onTabChange, onGoClick, bisaGo = true }) {
  return (
    <nav style={s.nav}>
      <div style={{ justifySelf: 'start' }}>
        <IconBtn label="Home" aktif={tabAktif === 'home'} onClick={() => onTabChange('home')}>
          <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
        </IconBtn>
      </div>

      <button
        style={bisaGo ? s.goBtn : s.goBtnDisabled}
        onClick={bisaGo ? onGoClick : undefined}
        disabled={!bisaGo}
        aria-label={bisaGo ? 'Kirim sinyal jemput atau antar' : 'Masih ada perjalanan aktif'}
      >
        GO
      </button>

      <div style={{ justifySelf: 'end', display: 'flex', gap: 16 }}>
        <IconBtn label="Jadwal" aktif={tabAktif === 'jadwal'} onClick={() => onTabChange('jadwal')}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </IconBtn>
        <IconBtn label="Riwayat" aktif={tabAktif === 'riwayat'} onClick={() => onTabChange('riwayat')}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </IconBtn>
      </div>
    </nav>
  )
}

function IconBtn({ label, aktif, onClick, children }) {
  return (
    <button style={aktif ? s.iconBtnAktif : s.iconBtn} onClick={onClick} aria-label={label}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
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
    padding: '10px 20px calc(var(--safe-bottom) + 10px)',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    zIndex: 1000,
  },
  iconBtn: {
    color: 'var(--text-dim)',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnAktif: {
    color: 'var(--web-red)',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtn: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: 'var(--web-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.02em',
    marginTop: -26,
    boxShadow: '0 4px 16px rgba(226,54,54,0.45)',
    border: '3px solid var(--bg)',
    justifySelf: 'center',
  },
  goBtnDisabled: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: 'var(--text-dim)',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.02em',
    marginTop: -26,
    border: '3px solid var(--bg)',
    justifySelf: 'center',
    cursor: 'not-allowed',
  },
}