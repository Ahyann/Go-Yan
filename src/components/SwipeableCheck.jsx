import { useRef, useState } from 'react'

const LEBAR_CHECK = 56
const AMBANG_BATAS = 30

export default function SwipeableCheck({ children, selesai, onToggle }) {
  const [geser, setGeser] = useState(0)
  const mulaiX = useRef(null)
  const gesekIni = useRef(0)

  function handleStart(clientX) {
    mulaiX.current = clientX
    gesekIni.current = geser
  }

  function handleMove(clientX) {
    if (mulaiX.current === null) return
    const delta = mulaiX.current - clientX
    const nilaiBaru = Math.min(Math.max(gesekIni.current + delta, 0), LEBAR_CHECK)
    setGeser(nilaiBaru)
  }

  function handleEnd() {
    if (mulaiX.current === null) return
    mulaiX.current = null
    if (geser > AMBANG_BATAS) {
      setGeser(LEBAR_CHECK)
    } else {
      setGeser(0)
    }
  }

  function handleCheckClick() {
    setGeser(0)
    onToggle(!selesai)
  }

  return (
    <div style={s.wrap}>
      <button style={s.checkBtn} onClick={handleCheckClick} aria-label="Tandai selesai">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </button>

      <div
        style={{
          ...s.geser,
          transform: `translateX(-${geser}px)`,
          transition: mulaiX.current === null ? 'transform 0.2s ease' : 'none',
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
        {children}
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },
  checkBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: LEBAR_CHECK,
    background: 'var(--glow-blue-mid)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  geser: {
    position: 'relative',
    touchAction: 'pan-y',
  },
}
