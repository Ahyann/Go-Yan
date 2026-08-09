import { useLanguage } from '../context/LanguageContext.jsx'

export default function OjekNav({ tabAktif, onTabChange, adaChatBaru = false }) {
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
      <span style={aktif ? s.labelAktif : s.label}>{label}</span>
    </button>
  )
}

const s = {
  nav: {
    background: 'var(--nav-red)',
    padding: '12px 20px calc(var(--safe-bottom) + 10px)',
    display: 'flex',
    justifyContent: 'space-around',
    flexShrink: 0,
  },
  iconBtn: {
    color: 'rgba(255,255,255,0.55)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  iconBtnAktif: {
    color: 'var(--glow-blue)',
    filter: 'drop-shadow(0 0 4px var(--glow-blue-mid))',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  label: { fontSize: 10.5, color: 'rgba(255,255,255,0.55)' },
  labelAktif: { fontSize: 10.5, color: 'var(--glow-blue)' },
}
