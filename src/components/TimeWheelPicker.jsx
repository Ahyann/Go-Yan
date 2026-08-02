import { useEffect, useRef } from 'react'

const ITEM_HEIGHT = 40
const VISIBLE_ROWS = 3
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS
const PAD = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2

const JAM = Array.from({ length: 24 }, (_, i) => i)
const MENIT = Array.from({ length: 60 }, (_, i) => i)

export default function TimeWheelPicker({ value, onChange }) {
  const [jamAwal, menitAwal] = value.split(':').map(Number)
  const jamRef = useRef(null)
  const menitRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (jamRef.current) jamRef.current.scrollTop = jamAwal * ITEM_HEIGHT
    if (menitRef.current) menitRef.current.scrollTop = menitAwal * ITEM_HEIGHT
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleScroll(ref, panjangList, tipe) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const index = Math.round(el.scrollTop / ITEM_HEIGHT)
      const clamped = Math.min(Math.max(index, 0), panjangList - 1)
      el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: 'smooth' })

      const [jamSaatIni, menitSaatIni] = value.split(':').map(Number)
      const jamBaru = tipe === 'jam' ? clamped : jamSaatIni
      const menitBaru = tipe === 'menit' ? clamped : menitSaatIni
      const pad = (n) => String(n).padStart(2, '0')
      onChange(`${pad(jamBaru)}:${pad(menitBaru)}`)
    }, 120)
  }

  return (
    <div style={s.wrap}>
      <div style={s.highlight} />
      <Kolom listRef={jamRef} data={JAM} onScroll={() => handleScroll(jamRef, JAM.length, 'jam')} />
      <div style={s.titik}>:</div>
      <Kolom listRef={menitRef} data={MENIT} onScroll={() => handleScroll(menitRef, MENIT.length, 'menit')} />
    </div>
  )
}

function Kolom({ listRef, data, onScroll }) {
  return (
    <div className="no-scrollbar" style={s.kolom} ref={listRef} onScroll={onScroll}>
      {data.map((n) => (
        <div key={n} style={s.item}>
          {String(n).padStart(2, '0')}
        </div>
      ))}
    </div>
  )
}

const s = {
  wrap: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: CONTAINER_HEIGHT,
    gap: 4,
  },
  kolom: {
    height: CONTAINER_HEIGHT,
    width: 64,
    overflowY: 'scroll',
    scrollSnapType: 'y mandatory',
    padding: `${PAD}px 0`,
    scrollbarWidth: 'none',
  },
  item: {
    height: ITEM_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontVariantNumeric: 'tabular-nums',
    scrollSnapAlign: 'center',
    color: 'var(--text)',
  },
  titik: { fontSize: 22, fontWeight: 700, color: 'var(--text-dim)' },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: ITEM_HEIGHT,
    borderTop: '1px solid var(--line)',
    borderBottom: '1px solid var(--line)',
    pointerEvents: 'none',
  },
}