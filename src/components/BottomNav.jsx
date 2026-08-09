import { useLanguage } from '../context/LanguageContext.jsx'

export default function BottomNav({ tabAktif, onTabChange, onGoClick, modeGo = 'go', adaChatBaru = false }) {
  const { t } = useLanguage()
  return (
    <nav style={s.nav}>
      <IconBtn label={t.navHome} aktif={tabAktif === 'home'} onClick={() => onTabChange('home')} badge={adaChatBaru}>
        <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
      </IconBtn>

      <IconBtn label={t.navJadwal} aktif={tabAktif === 'jadwal'} onClick={() => onTabChange('jadwal')}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </IconBtn>

      <button
        style={modeGo === 'disabled' ? s.goBtnDisabled : modeGo === 'batal' ? s.goBtnBatal : s.goBtn}
        onClick={modeGo === 'disabled' ? undefined : onGoClick}
        disabled={modeGo === 'disabled'}
        aria-label={
          modeGo === 'go' ? t.ariaGoKirim
          : modeGo === 'batal' ? t.ariaGoBatal
          : t.ariaGoDisabled
        }
      >
        {modeGo === 'batal' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          'GO'
        )}
      </button>

      <IconBtn label={t.navRiwayat} aktif={tabAktif === 'riwayat'} onClick={() => onTabChange('riwayat')}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </IconBtn>

      <IconBtn label={t.navAkun} aktif={tabAktif === 'akun'} onClick={() => onTabChange('akun')}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.5-4 5-5.5 7-5.5s5.5 1.5 7 5.5" />
      </IconBtn>
    </nav>
  )
}

function IconBtn({ label, aktif, onClick, children, badge = false }) {
  return (
    <button style={aktif ? s.iconBtnAktif : s.iconBtn} onClick={onClick} aria-label={label}>
      <div style={s.iconWrap}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </svg>
        {badge && <span style={s.badgeDot} />}
      </div>
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
    background: 'var(--nav-red)',
    padding: '12px 12px calc(var(--safe-bottom) + 10px)',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    alignItems: 'center',
    justifyItems: 'center',
    zIndex: 1000,
  },
  iconBtn: {
    color: 'rgba(255,255,255,0.55)',
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnAktif: {
    color: 'var(--glow-blue)',
    filter: 'drop-shadow(0 0 4px var(--glow-blue-mid))',
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Titik merah kecil di pojok kanan atas icon — nunjukkin ada chat
  // baru yang belum dibuka, ilang begitu tab Home dibuka.
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: '#FF3B30',
    border: '1.5px solid var(--nav-red)',
    boxShadow: '0 0 4px rgba(255,59,48,0.8)',
  },
  goBtn: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: 'var(--bg)',
    color: 'var(--glow-blue)',
    fontFamily: 'var(--font-data)',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.03em',
    textShadow: '0 0 6px var(--glow-blue-mid)',
    marginTop: -30,
    boxShadow: '0 0 10px var(--glow-blue), 0 0 22px var(--glow-blue-mid)',
    border: '3px solid var(--nav-red)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtnBatal: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: 'var(--bg)',
    color: 'var(--web-red)',
    marginTop: -30,
    boxShadow: '0 0 10px var(--web-red), 0 0 22px rgba(226,54,54,0.5)',
    border: '3px solid var(--nav-red)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtnDisabled: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: 'var(--bg)',
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'var(--font-data)',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.03em',
    marginTop: -30,
    border: '3px solid var(--nav-red)',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}
