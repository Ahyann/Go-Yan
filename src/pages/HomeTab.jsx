import { useEffect, useState } from 'react'
import { STATUS_PERMINTAAN } from '../lib/constants'
import { useLokasiSayaPenumpang } from '../lib/useLokasiSayaPenumpang'
import PetaStatus from '../components/PetaStatus.jsx'

export default function HomeTab({ permintaan }) {
  const { aktif: lokasiAktif, error: lokasiError, mulai: mulaiLokasi, berhenti: berhentiLokasi } = useLokasiSayaPenumpang()
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (!sedangJalan && lokasiAktif) {
      berhentiLokasi()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedangJalan])

  function handleMulai() {
    mulaiLokasi()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  return (
    <div style={s.wrap}>
      <div style={s.headerFloat}>
        <div style={s.eyebrow}>PENUMPANG</div>
        <h1 style={s.title}>Halo, Fajri</h1>
      </div>

      {sedangJalan && (
        <button
          style={lokasiAktif ? s.shareIconAktif : s.shareIcon}
          onClick={lokasiAktif ? berhentiLokasi : handleMulai}
          aria-label={lokasiAktif ? 'Matikan share lokasi' : 'Share lokasi ke Ahyan'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </button>
      )}
      {sedangJalan && showToast && (
        <div style={s.statusAktifFloat}>Kamu menyalakan live location</div>
      )}
      {sedangJalan && lokasiError && (
        <div style={s.lokasiErrorFloat}>{lokasiError}</div>
      )}

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
    fontFamily: 'var(--font-judul)',
    fontSize: 26,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
    textShadow: '0 1px 6px rgba(0,0,0,0.8)',
  },
  shareIcon: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 86px)',
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#fff',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
    zIndex: 1000,
    isolation: 'isolate',
  },
  shareIconAktif: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 86px)',
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#B8242F',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 10px #B8242F, 0 1px 5px rgba(0,0,0,0.4)',
    zIndex: 1000,
    isolation: 'isolate',
  },
  statusAktifFloat: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 128px)',
    right: 10,
    maxWidth: 150,
    background: 'rgba(184,36,47,0.92)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: 8,
    textAlign: 'center',
    zIndex: 1000,
  },
  lokasiErrorFloat: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 128px)',
    right: 10,
    maxWidth: 160,
    background: 'rgba(11,14,26,0.95)',
    color: 'var(--web-red)',
    fontSize: 11,
    padding: '6px 8px',
    borderRadius: 8,
    textAlign: 'center',
    zIndex: 1000,
  },
}