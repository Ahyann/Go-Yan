import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { playKonsolMati } from '../lib/sound'
import { getar } from '../lib/getar'

const LEBAR_TOMBOL = 76
const JARAK_TOMBOL = 8
const JARAK_KARTU = 8
const AMBANG_BATAS = 40
const LAMA_GLITCH = 560 // ms animasi glitch lalu menyusut seperti TV dimatikan
const LAMA_TUTUP = 200 // ms celah kartu menutup sebelum datanya benar-benar dihapus

const LABEL = { id: { edit: 'Edit', hapus: 'Hapus' }, en: { edit: 'Edit', hapus: 'Delete' } }

export default function SwipeableItem({ children, onDelete, onEdit }) {
  const { lang } = useLanguage()
  const label = LABEL[lang] || LABEL.id
  const zonaDelete = LEBAR_TOMBOL + JARAK_TOMBOL
  const lebarTombol = onEdit ? LEBAR_TOMBOL * 2 + JARAK_TOMBOL * 2 : zonaDelete
  // Ditambah JARAK_KARTU biar pas kebuka penuh, card-nya berhenti
  // dikit sebelum nempel ke tombol edit/delete-nya.
  const lebarTerbuka = lebarTombol + JARAK_KARTU

  const [geser, setGeser] = useState(0)
  const [fase, setFase] = useState(null) // null | 'glitch' | 'tutup'
  const [tinggi, setTinggi] = useState(null)
  const wrapRef = useRef(null)
  const timerRef = useRef([])
  useEffect(() => () => timerRef.current.forEach(clearTimeout), [])

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
    if (fase) return
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

  // Hapus: kartu glitch merah-biru lalu menyusut jadi garis seperti TV dimatikan (satu bunyi TV mati + getar pendek),
  // celahnya menutup, baru datanya dihapus
  function handleDeleteClick() {
    if (fase) return
    setGeser(0)
    setFase('glitch')
    playKonsolMati()
    getar(15)
    timerRef.current.push(setTimeout(() => {
      setTinggi(wrapRef.current?.offsetHeight ?? null)
      setFase('tutup')
      requestAnimationFrame(() => requestAnimationFrame(() => setTinggi(0)))
    }, LAMA_GLITCH))
    timerRef.current.push(setTimeout(() => onDelete(), LAMA_GLITCH + LAMA_TUTUP))
  }

  function handleEditClick() {
    setGeser(0)
    onEdit()
  }

  const skalaEdit = 0.4 + 0.6 * progresEdit
  const skalaDelete = 0.4 + 0.6 * progresDelete

  return (
    <div
      ref={wrapRef}
      style={{ ...s.wrap, ...(fase === 'tutup' ? { height: tinggi ?? 'auto', transition: `height ${LAMA_TUTUP}ms ease-in` } : null) }}
    >
      <div style={{ ...s.aksiRow, opacity: fase ? 0 : 1 }}>
        {onEdit && (
          <button
            type="button"
            style={{
              ...s.tombol,
              ...s.editBtn,
              transform: `scale(${skalaEdit})`,
              opacity: progresEdit,
            }}
            onClick={handleEditClick}
            aria-label={label.edit}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16z" />
              <path d="M13 7l4 4" />
            </svg>
            <span>{label.edit}</span>
          </button>
        )}
        <button
          type="button"
          data-tanpa-suara
          style={{
            ...s.tombol,
            ...s.deleteBtn,
            transform: `scale(${skalaDelete})`,
            opacity: progresDelete,
          }}
          onClick={handleDeleteClick}
          aria-label={label.hapus}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true">
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
          </svg>
          <span>{label.hapus}</span>
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
        <div className={fase ? 'hapus-glitch' : undefined}>{children}</div>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 0,
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
  // Tombol bergaris tepi tanpa isi: ikon dan tulisan senada dengan warna tepinya
  tombol: {
    width: LEBAR_TOMBOL,
    height: 'calc(100% - 16px)',
    background: 'transparent',
    borderRadius: 0,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    transformOrigin: 'center',
    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
  },
  editBtn: { border: '2px solid #F5B820', color: '#F5B820' },
  deleteBtn: { border: '2px solid #FF5A5F', color: '#FF5A5F' },
  geser: {
    position: 'relative',
    touchAction: 'pan-y',
  },
}
