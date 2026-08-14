import { useRef, useState } from 'react'

export default function SwipeToFinish({ label, onConfirm }) {
  const [geser, setGeser] = useState(0)
  const [mengonfirmasi, setMengonfirmasi] = useState(false)
  const trackRef = useRef(null)
  const handleRef = useRef(null)
  const mulaiX = useRef(null)
  const gesekIni = useRef(0)
  const sudahTrigger = useRef(false)

  const LEBAR_HANDLE = 48

  function batasGeser() {
    const track = trackRef.current
    if (!track) return 0
    return track.clientWidth - LEBAR_HANDLE
  }

  function handleStart(clientX) {
    if (mengonfirmasi) return
    mulaiX.current = clientX
    gesekIni.current = geser
    sudahTrigger.current = false
  }

  function handleMove(clientX) {
    if (mulaiX.current === null || mengonfirmasi) return
    const delta = clientX - mulaiX.current
    const maks = batasGeser()
    const nilaiBaru = Math.min(Math.max(gesekIni.current + delta, 0), maks)
    setGeser(nilaiBaru)

    if (!sudahTrigger.current && maks > 0 && nilaiBaru >= maks * 0.9) {
      sudahTrigger.current = true
      setMengonfirmasi(true)
      setGeser(maks)
      setTimeout(() => {
        onConfirm()
      }, 180)
    }
  }

  function handleEnd() {
    if (mulaiX.current === null) return
    mulaiX.current = null
    if (!sudahTrigger.current) {
      setGeser(0)
    }
  }

  return (
    <div ref={trackRef} style={s.track}>
      <div style={s.labelWrap}>
        <span style={s.label}>{label}</span>
      </div>
      <div
        ref={handleRef}
        style={{
          ...s.handle,
          transform: `translateX(${geser}px)`,
          transition: mulaiX.current === null ? 'transform 0.25s ease' : 'none',
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => {
          if (mulaiX.current !== null) handleMove(e.clientX)
        }}
        onMouseUp={handleEnd}
        onMouseLeave={() => {
          if (mulaiX.current !== null) handleEnd()
        }}
      >
        {mengonfirmasi ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#08130d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#08130d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
    height: 48,
    borderRadius: 999,
    background: 'rgba(74,222,128,0.15)',
    border: '1px solid var(--signal)',
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
    fontWeight: 600,
    color: 'var(--signal)',
  },
  handle: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'var(--signal)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    cursor: 'grab',
  },
}