import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { STATUS_PERMINTAAN } from '../lib/constants'
import { useLokasiOjek } from '../lib/useLokasiOjek'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { useLanguage } from '../context/LanguageContext.jsx'
import PetaStatus from '../components/PetaStatus.jsx'
import KirimPesanPopup from '../components/KirimPesanPopup.jsx'

export default function HomeTab({ permintaan, lokasiAktif, lokasiError, mulaiLokasi, berhentiLokasi }) {
  const { t } = useLanguage()
  const lokasiOjek = useLokasiOjek()
  const { kirimPesan } = usePesanPenumpang()
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  const [showToast, setShowToast] = useState(false)
  const [showKirimPesan, setShowKirimPesan] = useState(false)
  const mapRef = useRef(null)

  function handleMulai() {
    mulaiLokasi()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  function handleBerhenti() {
    berhentiLokasi()
    setShowToast(false)
  }

  function handleRecenter() {
    if (lokasiOjek && mapRef.current) {
      mapRef.current.setView([lokasiOjek.lat, lokasiOjek.lng], 16)
    }
  }

  const adaLokasiLive = lokasiOjek && sedangJalan

  return (
    <div style={s.wrap}>
      <div style={s.headerFloat}>
        <div style={s.eyebrow}>{t.penumpangEyebrow}</div>
        <h1 style={s.title}>{t.penumpangHalo}</h1>
      </div>

      <PetaStatus permintaan={permintaan} mapRef={mapRef} />

      {sedangJalan && createPortal(
        <>
          <button
            style={lokasiAktif ? s.shareIconAktif : s.shareIcon}
            onClick={lokasiAktif ? handleBerhenti : handleMulai}
            aria-label={lokasiAktif ? t.ariaMatikanShare : t.ariaNyalakanShare}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </button>

          {adaLokasiLive && (
            <button
              className="btn-map-control"
              style={s.recenterIcon}
              onClick={handleRecenter}
              aria-label={t.ariaKembaliLokasiAhyan}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </button>
          )}

          <button
            className="btn-map-control"
            style={adaLokasiLive ? s.pesanIconBawah : s.pesanIcon}
            onClick={() => setShowKirimPesan(true)}
            aria-label={t.ariaKirimPesanAhyan}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
          </button>

          {showToast && (
            <div style={s.statusAktifFloat}>{t.liveLocationAktif}</div>
          )}
          {lokasiError && (
            <div style={s.lokasiErrorFloat}>{lokasiError}</div>
          )}
        </>,
        document.body
      )}

      {showKirimPesan && (
        <KirimPesanPopup onClose={() => setShowKirimPesan(false)} onKirim={kirimPesan} />
      )}
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
    fontFamily: 'var(--font-judul)',
    fontSize: 26,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
    textShadow: '0 1px 6px rgba(0,0,0,0.8)',
  },
  shareIcon: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 86px)',
    right: 'calc(max(0px, (100vw - 480px) / 2) + 10px)',
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#ffffff',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
    zIndex: 99999,
  },
  shareIconAktif: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 86px)',
    right: 'calc(max(0px, (100vw - 480px) / 2) + 10px)',
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#B8242F',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 10px #B8242F, 0 1px 5px rgba(0,0,0,0.4)',
    zIndex: 99999,
  },
  recenterIcon: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 128px)',
    right: 'calc(max(0px, (100vw - 480px) / 2) + 10px)',
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#ffffff',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
    zIndex: 99999,
  },
  pesanIcon: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 128px)',
    right: 'calc(max(0px, (100vw - 480px) / 2) + 10px)',
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#ffffff',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
    zIndex: 99999,
  },
  pesanIconBawah: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 170px)',
    right: 'calc(max(0px, (100vw - 480px) / 2) + 10px)',
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#ffffff',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
    zIndex: 99999,
  },
  statusAktifFloat: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 86px)',
    right: 'calc(max(0px, (100vw - 480px) / 2) + 10px + 36px + 8px)',
    maxWidth: 140,
    background: '#B8242F',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    padding: '8px 12px',
    borderRadius: 8,
    textAlign: 'right',
    zIndex: 99999,
  },
  lokasiErrorFloat: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 210px)',
    right: 'calc(max(0px, (100vw - 480px) / 2) + 10px)',
    maxWidth: 160,
    background: '#0B0E1A',
    color: '#E23636',
    fontSize: 11,
    padding: '6px 8px',
    borderRadius: 8,
    textAlign: 'center',
    zIndex: 99999,
  },
}
