import { useEffect, useRef, useState } from 'react'
import { playGeserTik } from '../lib/sound'

// tinggi: tinggi trek dalam px. konsol: gaya layar konsol (trek gelap bergaris cyan, huruf piksel).
export default function SwipeToFinish({ label, onConfirm, tinggi = 52, konsol = false }) {
  const trackRef = useRef(null)
  const handleRef = useRef(null)
  const labelRef = useRef(null)
  const fillRef = useRef(null)
  const mulaiX = useRef(null)
  const gesekIni = useRef(0)
  const gesekSekarang = useRef(0)
  const sudahTrigger = useRef(false)
  const langkahTik = useRef(0)
  const [mengonfirmasi, setMengonfirmasi] = useState(false)

  const DIAMETER = tinggi

  function batasGeser() {
    const track = trackRef.current
    if (!track) return 0
    return track.clientWidth - DIAMETER
  }

  function terapkanPosisi(x, animasi) {
    const handle = handleRef.current
    const lbl = labelRef.current
    const fill = fillRef.current
    if (!handle) return

    const transisi = animasi ? 'all 0.25s cubic-bezier(0.34, 1.2, 0.64, 1)' : 'none'
    handle.style.transition = transisi
    handle.style.transform = `translateX(${x}px)`

    if (fill) {
      fill.style.transition = transisi
      fill.style.width = `${x + DIAMETER}px`
    }

    if (lbl) {
      const maks = batasGeser()
      const opasitas = maks > 0 ? Math.max(0, 1 - (x / maks) * 1.3) : 1
      lbl.style.opacity = mengonfirmasi ? 1 : opasitas
    }
  }

  function handleStart(clientX) {
    if (mengonfirmasi) return
    mulaiX.current = clientX
    gesekIni.current = gesekSekarang.current
    sudahTrigger.current = false
  }

  function handleMove(clientX) {
    if (mulaiX.current === null || mengonfirmasi) return
    const delta = clientX - mulaiX.current
    const maks = batasGeser()
    const nilaiBaru = Math.min(Math.max(gesekIni.current + delta, 0), maks)
    gesekSekarang.current = nilaiBaru
    terapkanPosisi(nilaiBaru, false)

    // Bunyi tik tiap melewati 10% jarak (naik atau turun), bukan sekali saja
    const langkah = maks > 0 ? Math.floor((nilaiBaru / maks) * 10) : 0
    if (langkah !== langkahTik.current) {
      langkahTik.current = langkah
      if (langkah > 0) playGeserTik(langkah)
    }

    if (!sudahTrigger.current && maks > 0 && nilaiBaru >= maks * 0.88) {
      sudahTrigger.current = true
      setMengonfirmasi(true)
      terapkanPosisi(maks, true)
      if (labelRef.current) labelRef.current.style.opacity = 1
      setTimeout(() => onConfirm(), 200)
    }
  }

  function handleEnd() {
    if (mulaiX.current === null) return
    mulaiX.current = null
    langkahTik.current = 0
    if (!sudahTrigger.current) {
      gesekSekarang.current = 0
      terapkanPosisi(0, true)
    }
  }

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return

    const onTouchStart = (e) => handleStart(e.touches[0].clientX)
    const onTouchMove = (e) => handleMove(e.touches[0].clientX)
    const onTouchEnd = () => handleEnd()
    const onMouseDown = (e) => {
      handleStart(e.clientX)
      const onMouseMove = (ev) => handleMove(ev.clientX)
      const onMouseUp = () => {
        handleEnd()
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }

    handle.addEventListener('touchstart', onTouchStart, { passive: true })
    handle.addEventListener('touchmove', onTouchMove, { passive: true })
    handle.addEventListener('touchend', onTouchEnd)
    handle.addEventListener('mousedown', onMouseDown)

    return () => {
      handle.removeEventListener('touchstart', onTouchStart)
      handle.removeEventListener('touchmove', onTouchMove)
      handle.removeEventListener('touchend', onTouchEnd)
      handle.removeEventListener('mousedown', onMouseDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mengonfirmasi])

  return (
    <div ref={trackRef} style={{ ...s.track, height: tinggi, ...(konsol ? s.trackKonsol : null) }}>
      <div ref={fillRef} style={{ ...s.fill, height: tinggi, width: tinggi, ...(konsol ? s.fillKonsol : null) }} />

      <div ref={labelRef} style={s.labelWrap}>
        <span style={{ ...s.label, ...(konsol ? s.labelKonsol : null) }}>{mengonfirmasi ? 'Selesai! ✓' : label}</span>
        {konsol && !mengonfirmasi && (
          <span aria-hidden="true" style={{ display: 'inline-flex', gap: 1, marginLeft: 6, color: '#5ED0FF', fontSize: 11 }}>
            <span className="panah-kedip">▸</span>
            <span className="panah-kedip" style={{ animationDelay: '0.2s' }}>▸</span>
            <span className="panah-kedip" style={{ animationDelay: '0.4s' }}>▸</span>
          </span>
        )}
      </div>

      <div ref={handleRef} style={{ ...s.handle, width: tinggi, height: tinggi, ...(konsol ? s.handleKonsol : null) }}>
        {mengonfirmasi ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        )}
      </div>
    </div>
  )
}

const s = {
  trackKonsol: { background: '#1E1E1E', boxShadow: 'inset 0 0 0 2px #5ED0FF' },
  fillKonsol: { background: 'rgba(188, 30, 47, 0.55)' },
  labelKonsol: { fontFamily: "'Silkscreen', monospace", fontSize: 12, fontWeight: 400, letterSpacing: '0.08em', color: '#94DDF4', textTransform: 'uppercase' },
  handleKonsol: { boxShadow: 'inset 0 -3px 0 #7F1820, inset 0 0 0 2px #FF6B78' },
  track: {
    position: 'relative',
    boxSizing: 'border-box',
    height: 52,
    borderRadius: 0,
    background: 'var(--bg)',
    boxShadow: 'inset 0 0 0 1px var(--garis)',
    overflow: 'hidden',
    touchAction: 'pan-y',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 52,
    width: 52,
    borderRadius: 0,
    background: 'var(--nav-red)',
  },
  labelWrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  label: {
    fontSize: 14.5,
    fontWeight: 800,
    letterSpacing: '0.3px',
    color: '#fff',
  },
  handle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 52,
    height: 52,
    borderRadius: 0,
    background: 'var(--nav-red)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 -4px 0 #7F1820',
    cursor: 'grab',
    touchAction: 'none',
    willChange: 'transform',
    zIndex: 2,
  },
}