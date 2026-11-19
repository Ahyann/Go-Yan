import { useEffect, useRef, useState } from 'react'
import { playJamTik } from '../lib/sound'

const ITEM_HEIGHT = 44
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
  // Angka yang sedang berada di baris tengah, dipakai untuk menandai angka aktif dan membunyikan klik.
  const [pusat, setPusat] = useState({ jam: jamAwal, menit: menitAwal })
  const pusatRef = useRef(pusat)

  useEffect(() => {
    if (jamRef.current) jamRef.current.scrollTop = jamAwal * ITEM_HEIGHT
    if (menitRef.current) menitRef.current.scrollTop = menitAwal * ITEM_HEIGHT
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleScroll(ref, panjangList, tipe) {
    const el = ref.current
    if (!el) return

    // Angka di tengah diperbarui selama menggulung, dan tiap pergantian angka berbunyi satu klik.
    const langsung = Math.min(Math.max(Math.round(el.scrollTop / ITEM_HEIGHT), 0), panjangList - 1)
    if (pusatRef.current[tipe] !== langsung) {
      pusatRef.current = { ...pusatRef.current, [tipe]: langsung }
      setPusat(pusatRef.current)
      playJamTik()
    }

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      el.scrollTo({ top: langsung * ITEM_HEIGHT, behavior: 'smooth' })

      const [jamSaatIni, menitSaatIni] = value.split(':').map(Number)
      const jamBaru = tipe === 'jam' ? langsung : jamSaatIni
      const menitBaru = tipe === 'menit' ? langsung : menitSaatIni
      const pad = (n) => String(n).padStart(2, '0')
      onChange(`${pad(jamBaru)}:${pad(menitBaru)}`)
    }, 120)
  }

  return (
    <div style={s.wrap}>
      <div className="sudut-cyan" style={s.highlight} />
      <Kolom listRef={jamRef} data={JAM} aktif={pusat.jam} onScroll={() => handleScroll(jamRef, JAM.length, 'jam')} />
      <div style={s.titik}>:</div>
      <Kolom listRef={menitRef} data={MENIT} aktif={pusat.menit} onScroll={() => handleScroll(menitRef, MENIT.length, 'menit')} />
    </div>
  )
}

function Kolom({ listRef, data, aktif, onScroll }) {
  return (
    <div className="no-scrollbar" style={s.kolom} ref={listRef} onScroll={onScroll}>
      {data.map((n) => (
        <div key={n} style={n === aktif ? s.itemAktif : s.item}>
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
    width: 72,
    overflowY: 'scroll',
    scrollSnapType: 'y mandatory',
    padding: `${PAD}px 0`,
    scrollbarWidth: 'none',
    position: 'relative',
    zIndex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-judul)',
    letterSpacing: '0.04em',
    fontSize: 26,
    fontVariantNumeric: 'tabular-nums',
    scrollSnapAlign: 'center',
    color: 'rgba(176, 186, 214, 0.45)',
    transition: 'color 0.12s, font-size 0.12s',
  },
  itemAktif: {
    height: ITEM_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-judul)',
    letterSpacing: '0.04em',
    fontSize: 40,
    fontVariantNumeric: 'tabular-nums',
    scrollSnapAlign: 'center',
    color: '#fff',
    textShadow: '0 0 10px rgba(94, 208, 255, 0.7)',
    transition: 'color 0.12s, font-size 0.12s',
  },
  titik: { position: 'relative', zIndex: 1, fontFamily: 'var(--font-judul)', fontSize: 36, color: 'var(--glow-blue)', width: 14, textAlign: 'center' },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(94, 208, 255, 0.1)',
    pointerEvents: 'none',
  },
}
