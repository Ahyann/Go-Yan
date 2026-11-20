import { useLanguage } from '../context/LanguageContext.jsx'
import { DeretanTab, DOCK_GELAP } from './TabDock.jsx'

const MERAH_GELAP = '#7F1820'

export default function BottomNav({ tabAktif, onTabChange, onGoClick, modeGo = 'go', adaChatBaru = false, adaRiwayatBaru = false }) {
  const { t } = useLanguage()
  const mati = modeGo === 'disabled'

  return (
    <nav className="bingkai-piksel" style={s.nav}>
      <div className="bingkai-piksel-dalam" style={s.dalam}>
      <DeretanTab
        aktif={tabAktif}
        onPilih={onTabChange}
        tab={[
          { id: 'home', label: t.navHome, teks: t.navHome, badge: adaChatBaru, ikon: (
            <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
          ) },
          { id: 'jadwal', label: t.navJadwal, teks: t.navJadwal, badge: false, ikon: (
            <><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /></>
          ) },
          { id: 'riwayat', label: t.navRiwayat, teks: t.navRiwayat, badge: adaRiwayatBaru, ikon: (
            <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>
          ) },
          { id: 'akun', label: t.navAkun, teks: t.navAkun, badge: false, ikon: (
            <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.5-4 5-5.5 7-5.5s5.5 1.5 7 5.5" /></>
          ) },
        ]}
      />

      {/* Tombol aksi miring di kanan. Kemiringan ada di span dalam supaya
          transform tombol (animasi muncul dan efek tekan) tidak menimpanya. */}
      <button
        key={modeGo}
        className={mati ? undefined : 'tekan go-muncul go-dock'}
        style={s.goLuar}
        onClick={mati ? undefined : onGoClick}
        disabled={mati}
        aria-label={
          modeGo === 'go' ? t.ariaGoKirim
          : modeGo === 'batal' ? t.ariaGoBatal
          : t.ariaGoDisabled
        }
      >
        <span style={mati ? s.goMati : s.go}>
          {modeGo === 'batal' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            'GO!'
          )}
        </span>
      </button>
      </div>
    </nav>
  )
}

const goDasar = {
  width: '100%',
  height: 46,
  padding: '0 0 3px',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-judul)',
  fontSize: 28,
  letterSpacing: '2px',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'skewX(-8deg)',
}

const s = {
  nav: {
    position: 'fixed',
    left: 14,
    right: 14,
    bottom: 'calc(var(--safe-bottom) + 14px)',
    maxWidth: 452,
    margin: '0 auto',
    height: 72,
    boxSizing: 'border-box',
    zIndex: 1200,
  },
  dalam: { height: '100%', boxSizing: 'border-box', background: DOCK_GELAP, display: 'flex', alignItems: 'center', gap: 2 },
  goLuar: { flexShrink: 0, width: 92, padding: '0 4px 0 6px', marginLeft: 2, display: 'flex', alignItems: 'center' },
  go: {
    ...goDasar,
    background: 'var(--nav-red)',
    boxShadow: `3px 3px 0 #000, inset 0 -4px 0 rgba(0, 0, 0, 0.28)`,
  },
  goMati: {
    ...goDasar,
    background: '#5A2A31',
    color: 'rgba(255, 255, 255, 0.4)',
    boxShadow: `inset 0 -4px 0 ${MERAH_GELAP}`,
    cursor: 'not-allowed',
  },
}
