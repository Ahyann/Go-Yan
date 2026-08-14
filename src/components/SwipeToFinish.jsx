import { useEffect, useRef, useState } from 'react'

export default function SwipeToFinish({ label, onConfirm }) {
  const trackRef = useRef(null)
  const handleRef = useRef(null)
  const labelRef = useRef(null)
  const fillRef = useRef(null)
  const mulaiX = useRef(null)
  const gesekIni = useRef(0)
  const gesekSekarang = useRef(0)
  const sudahTrigger = useRef(false)
  const [mengonfirmasi, setMengonfirmasi] = useState(false)

  const LEBAR_HANDLE = 44
  const PADDING = 3

  function batasGeser() {
    const track = trackRef.current
    if (!track) return 0
    return track.clientWidth - LEBAR_HANDLE - PADDING * 2
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
      fill.style.width = `${x + LEBAR_HANDLE + PADDING}px`
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
    <div ref={trackRef} style={s.track}>
      <div ref={fillRef} style={s.fill} />

      <div ref={labelRef} style={s.labelWrap}>
        <span style={s.label}>{mengonfirmasi ? 'Selesai! ✓' : label}</span>
      </div>

      <div ref={handleRef} style={s.handle}>
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
  track: {
    position: 'relative',
    boxSizing: 'border-box',
    height: 52,
    borderRadius: 999,
    background: '#F5F7FA',
    boxShadow: '0 2px 10px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    touchAction: 'pan-y',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 48,
    borderRadius: 999,
    background: 'transparent',
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
    color: 'var(--nav-red)',
  },
  handle: {
    position: 'absolute',
    top: '50%',
    marginTop: -23,
    left: 3,
    width: 46,
    height: 46,
    borderRadius: '50%',
    background: `linear-gradient(160deg, var(--nav-red), #8B1420)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(184,36,47,0.6)',
    cursor: 'grab',
    touchAction: 'none',
    willChange: 'transform',
    zIndex: 2,
  },
}