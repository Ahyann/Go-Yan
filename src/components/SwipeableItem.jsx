import { useRef, useState } from 'react'

const LEBAR_DELETE = 76
const AMBANG_BATAS = 40

export default function SwipeableItem({ children, onDelete }) {
  const [geser, setGeser] = useState(0)
  const [terbuka, setTerbuka] = useState(false)
  const mulaiX = useRef(null)
  const gesekIni = useRef(0)

  function handleStart(clientX) {
    mulaiX.current = clientX
    gesekIni.current = geser
  }

  function handleMove(clientX) {
    if (mulaiX.current === null) return
    const delta = clientX - mulaiX.current
    const nilaiBaru = Math.min(Math.max(gesekIni.current + delta, 0), LEBAR_DELETE)
    setGeser(nilaiBaru)
  }

  function handleEnd() {
    if (mulaiX.current === null) return
    mulaiX.current = null
    if (geser > AMBANG_BATAS) {
      setGeser(LEBAR_DELETE)
      setTerbuka(true)
    } else {
      setGeser(0)
      setTerbuka(false)
    }
  }

  function handleDeleteClick() {
    setGeser(0)
    setTerbuka(false)
    onDelete()
  }

  return (
    <div style={s.wrap}>
      <button style={s.deleteBtn} onClick={handleDeleteClick} aria-label="Hapus">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" />
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
    borderRadius: 10,
  },
  deleteBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: LEBAR_DELETE,
    background: 'var(--web-red)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  geser: {
    position: 'relative',
    touchAction: 'pan-y',
  },
}