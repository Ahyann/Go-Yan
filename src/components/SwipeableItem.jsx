import { useRef, useState } from 'react'

const LEBAR_TOMBOL = 76
const AMBANG_BATAS = 40

export default function SwipeableItem({ children, onDelete, onEdit }) {
  const lebarTerbuka = onEdit ? LEBAR_TOMBOL * 2 : LEBAR_TOMBOL

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
    const nilaiBaru = Math.min(Math.max(gesekIni.current + delta, 0), lebarTerbuka)
    setGeser(nilaiBaru)
  }

  function handleEnd() {
    if (mulaiX.current === null) return
    mulaiX.current = null
    if (geser > AMBANG_BATAS) {
      setGeser(lebarTerbuka)
    } else {
      setGeser(0)
    }
  }

  function handleDeleteClick() {
    setGeser(0)
    onDelete()
  }

  function handleEditClick() {
    setGeser(0)
    onEdit()
  }

  return (
    <div style={s.wrap}>
      <div style={s.aksiRow}>
        {onEdit && (
          <button style={s.editBtn} onClick={handleEditClick} aria-label="Edit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        )}
        <button style={s.deleteBtn} onClick={handleDeleteClick} aria-label="Hapus">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" />
          </svg>
        </button>
      </div>

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
  aksiRow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
  },
  editBtn: {
    width: LEBAR_TOMBOL,
    background: 'var(--warn)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: LEBAR_TOMBOL,
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
