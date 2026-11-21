import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AKSI } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { playNotifPil } from '../lib/sound'
import { getar } from '../lib/getar'

const DURASI_ANIMASI = 260
const DURASI_TAMPIL = 6000

// Notifikasi pesanan baru saat ojek sedang di tab lain: pil kaca biru kecil di tengah atas yang membal masuk,
// titik merah berkedip, dan garis cyan di bawah yang memendek sampai pil hilang sendiri. Ketuk pil untuk ke Home.
export default function PermintaanBaruToast({ permintaan, onTap, onDismiss }) {
  const { t, lang } = useLanguage()
  const { isDemo } = useAuth()
  const [tampil, setTampil] = useState(false)
  const nama = isDemo ? (lang === 'en' ? 'Passenger' : 'Penumpang') : 'Fajri'

  useEffect(() => {
    const id = requestAnimationFrame(() => setTampil(true))
    playNotifPil()
    getar(10)
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
        aria-label={`${isDemo ? t.permintaanBaruDemo : t.permintaanBaru}: ${permintaan.aksi === AKSI.JEMPUT ? t.jemput : t.antar} ${permintaan.waktu}`}
        className={tampil ? 'pil-notif-masuk' : undefined}
        style={{ ...s.pil, ...(tampil ? null : s.pilSembunyi) }}
        onClick={handleTap}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTap() } }}
      >
        <i className="kolon-kedip" style={s.titik} aria-hidden="true" />
        <span style={s.teks}>
          {nama} · {permintaan.aksi === AKSI.JEMPUT ? t.jemput : t.antar} {permintaan.waktu}
        </span>
        <i style={s.jalur} aria-hidden="true">
          <b className="pil-notif-waktu" style={{ ...s.sisa, animationDuration: `${DURASI_TAMPIL}ms` }} />
        </i>
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
    paddingTop: 'calc(var(--safe-top) + 14px)',
    zIndex: 9999999,
    pointerEvents: 'none',
  },
  pil: {
    pointerEvents: 'auto',
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    maxWidth: '100%',
    minHeight: 44,
    boxSizing: 'border-box',
    padding: '9px 18px 12px',
    background: 'rgba(2, 56, 84, 0.72)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(94, 208, 255, 0.5)',
    borderRadius: 999,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
    cursor: 'pointer',
    transition: `transform ${DURASI_ANIMASI}ms ease, opacity ${DURASI_ANIMASI}ms ease`,
  },
  pilSembunyi: { transform: 'translateY(-12px) scale(0.6)', opacity: 0 },
  titik: { width: 8, height: 8, background: '#ED1C24', boxShadow: '0 0 8px #ED1C24', flexShrink: 0, display: 'block' },
  teks: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  jalur: { position: 'absolute', left: 18, right: 18, bottom: 4, height: 2, background: 'rgba(94, 208, 255, 0.15)', display: 'block' },
  sisa: { display: 'block', height: 2, background: '#5ED0FF' },
}
