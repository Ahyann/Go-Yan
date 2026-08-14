import { useEffect, useRef, useState } from 'react'

export default function SwipeToFinish({ label, onConfirm }) {
  const trackRef = useRef(null)
  const handleRef = useRef(null)
  const labelRef = useRef(null)
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
    if (!handle) return
    handle.style.transition = animasi ? 'transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1)' : 'none'
    handle.style.transform = `translateX(${x}px)`
    if (lbl) {
      const maks = batasGeser()
      const opasitas = maks > 0 ? Math.max(0, 1 - (x / maks) * 1.3) : 1
      lbl.style.opacity = opasitas
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
      <div ref={labelRef} style={s.labelWrap}>
        <span style={s.label}>{label}</span>
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
    height: 50,
    borderRadius: 999,
    background: 'linear-gradient(90deg, rgba(184,36,47,0.10), rgba(184,36,47,0.18))',
    border: '1px solid var(--nav-red)',
    overflow: 'hidden',
    touchAction: 'pan-y',
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
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.3px',
    color: 'var(--nav-red)',
  },
  handle: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    left: 3,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--nav-red)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
    cursor: 'grab',
    touchAction: 'none',
    willChange: 'transform',
  },
}