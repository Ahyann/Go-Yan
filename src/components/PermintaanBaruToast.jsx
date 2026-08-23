import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AKSI } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'

const DURASI_ANIMASI = 300
const DURASI_TAMPIL = 6000

export default function PermintaanBaruToast({ permintaan, onTap, onDismiss }) {
  const { t } = useLanguage()
  const [tampil, setTampil] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setTampil(true))
    const timer = setTimeout(() => tutup(), DURASI_TAMPIL)

    return () => {
      cancelAnimationFrame(id)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tutup() {
    setTampil(false)
    setTimeout(() => onDismiss(), DURASI_ANIMASI)
  }

  function handleTap() {
    setTampil(false)
    setTimeout(() => onTap(), DURASI_ANIMASI)
  }

  return createPortal(
    <div style={s.wrapLuar}>
      <div
        role="button"
        tabIndex={0}
        style={{ ...s.card, ...(tampil ? s.cardTampil : s.cardSembunyi) }}
        onClick={handleTap}
      >
        <div style={s.ikonWrap}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>
        <div style={s.isi}>
          <div style={s.judul}>{t.permintaanBaru}</div>
          <div style={s.detail}>
            {permintaan.aksi === AKSI.JEMPUT ? t.jemput : t.antar} · {permintaan.where} · {permintaan.waktu}
          </div>
        </div>
        <button
          style={s.tutupBtn}
          onClick={(e) => {
            e.stopPropagation()
            tutup()
          }}
          aria-label="Tutup"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  )
}

const s = {
  wrapLuar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    padding: '0 16px',
    paddingTop: 'calc(var(--safe-top) + 12px)',
    zIndex: 9999999,
    pointerEvents: 'none',
  },
  card: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 420,
    background: `linear-gradient(160deg, var(--nav-red), #7A121C)`,
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 16,
    padding: '14px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(184,36,47,0.45)',
    transition: `transform ${DURASI_ANIMASI}ms ease, opacity ${DURASI_ANIMASI}ms ease`,
    cursor: 'pointer',
  },
  cardSembunyi: {
    transform: 'translateY(-140%)',
    opacity: 0,
  },
  cardTampil: {
    transform: 'translateY(0)',
    opacity: 1,
  },
  ikonWrap: {
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  isi: { flex: 1, minWidth: 0 },
  judul: { fontSize: 14, fontWeight: 700, color: '#fff' },
  detail: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tutupBtn: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}
