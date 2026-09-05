import { useRef, useState } from 'react'

const LEBAR_TOMBOL = 76
const JARAK_TOMBOL = 8
const JARAK_KARTU = 8
const AMBANG_BATAS = 40

export default function SwipeableItem({ children, onDelete, onEdit }) {
  const zonaDelete = LEBAR_TOMBOL + JARAK_TOMBOL
  const lebarTombol = onEdit ? LEBAR_TOMBOL * 2 + JARAK_TOMBOL * 2 : zonaDelete
  // Ditambah JARAK_KARTU biar pas kebuka penuh, card-nya berhenti
  // dikit sebelum nempel ke tombol edit/delete-nya.
  const lebarTerbuka = lebarTombol + JARAK_KARTU

  const [geser, setGeser] = useState(0)
  // Delete kepencet duluan begitu geseran nyentuh areanya sendiri;
  // edit baru mulai muncul setelah lewat area delete, dan pas geser
  // balik, edit ilang duluan sementara delete tetep utuh sampe
  // geserannya beneran balik ke area delete.
  const progresDelete = zonaDelete > 0 ? Math.min(1, geser / zonaDelete) : 0
  const progresEdit = onEdit
    ? Math.min(1, Math.max(0, (geser - zonaDelete) / (lebarTombol - zonaDelete)))
    : 0
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

  const skalaEdit = 0.4 + 0.6 * progresEdit
  const skalaDelete = 0.4 + 0.6 * progresDelete

  return (
    <div style={s.wrap}>
      <div style={s.aksiRow}>
        {onEdit && (
          <button
            style={{
              ...s.editBtn,
              transform: `scale(${skalaEdit})`,
              opacity: progresEdit,
            }}
            onClick={handleEditClick}
            aria-label="Edit"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        )}
        <button
          style={{
            ...s.deleteBtn,
            transform: `scale(${skalaDelete})`,
            opacity: progresDelete,
          }}
          onClick={handleDeleteClick}
          aria-label="Hapus"
        >
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
    alignItems: 'center',
    gap: JARAK_TOMBOL,
    paddingRight: JARAK_TOMBOL,
  },
  editBtn: {
    width: LEBAR_TOMBOL,
    height: 'calc(100% - 16px)',
    background: 'var(--warn)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: 'center',
    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
  },
  deleteBtn: {
    width: LEBAR_TOMBOL,
    height: 'calc(100% - 16px)',
    background: 'var(--web-red)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: 'center',
    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
  },
  geser: {
    position: 'relative',
    touchAction: 'pan-y',
  },
}
