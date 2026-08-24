import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { playMissionSuccess } from '../lib/sound'

const DURASI_ANIMASI = 350
const DURASI_TAMPIL = 3500

export default function MissionSuccessPopup({ onDismiss }) {
  const [tampil, setTampil] = useState(false)
  const sudahPutarSuara = useRef(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setTampil(true))

    playMissionSuccess().then((berhasil) => {
      sudahPutarSuara.current = berhasil
    })

    const timer = setTimeout(() => {
      handleClose()
    }, DURASI_TAMPIL)

    return () => {
      cancelAnimationFrame(id)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    if (!sudahPutarSuara.current) {
      playMissionSuccess()
      sudahPutarSuara.current = true
    }
    setTampil(false)
    setTimeout(() => {
      onDismiss()
    }, DURASI_ANIMASI)
  }

  return createPortal(
    <div style={s.overlay} onClick={handleClose}>
      <div
        style={{ ...s.card, ...(tampil ? s.cardTampil : s.cardSembunyi) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={s.checkWrap}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--signal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-6" />
          </svg>
        </div>

        <div style={s.judul}>MISSION{'\n'}SUCCESSFUL!</div>
        <div style={s.sub}>Great job, Spider-Man! 🕸️</div>
      </div>
    </div>,
    document.body
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 'calc(var(--safe-top) + 40px)',
    zIndex: 9999999,
    background: 'rgba(0,0,0,0.4)',
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    width: '86%',
    maxWidth: 340,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '2px solid var(--glow-blue-mid)',
    borderRadius: 20,
    padding: '28px 20px 22px',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 30px rgba(94,208,255,0.35)',
    transition: `transform ${DURASI_ANIMASI}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${DURASI_ANIMASI}ms ease`,
  },
  cardSembunyi: {
    transform: 'translateY(-80px) scale(0.6)',
    opacity: 0,
  },
  cardTampil: {
    transform: 'translateY(0) scale(1)',
    opacity: 1,
  },
  checkWrap: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: 'rgba(74,222,128,0.15)',
    border: '2px solid var(--signal)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
    boxShadow: '0 0 18px rgba(74,222,128,0.5)',
  },
  judul: {
    fontFamily: 'var(--font-judul)',
    fontSize: 24,
    letterSpacing: '1px',
    lineHeight: 1.15,
    color: 'var(--glow-blue)',
    textShadow: '0 0 10px var(--glow-blue-mid), 2px 2px 0 var(--nav-red)',
    whiteSpace: 'pre-line',
  },
  sub: {
    fontSize: 13,
    color: '#9FC3E8',
    marginTop: 10,
  },
}