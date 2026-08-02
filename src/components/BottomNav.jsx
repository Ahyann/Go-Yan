export default function BottomNav({ onGoClick }) {
  return (
    <nav style={s.nav}>
      <IconBtn label="Home">
        <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
      </IconBtn>

      <IconBtn label="Maps">
        <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
        <circle cx="12" cy="9" r="2.3" />
      </IconBtn>

      <button style={s.goBtn} onClick={onGoClick} aria-label="Kirim sinyal jemput atau antar">
        GO
      </button>

      <IconBtn label="Riwayat">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </IconBtn>

      {/* Slot ke-4 asli (kanan penuh) masih kosong, nunggu keputusan kamu */}
      <div style={{ width: 44 }} />
    </nav>
  )
}

function IconBtn({ label, children }) {
  return (
    <button style={s.iconBtn} aria-label={label}>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  iconBtn: {
    color: 'var(--text-dim)',
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
  },
}