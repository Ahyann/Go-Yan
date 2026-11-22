import { useEffect, useRef, useState } from 'react'
import { playJamTik } from '../lib/sound'

const ITEM_HEIGHT = 44
const VISIBLE_ROWS = 3
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS
const PAD = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2

const JAM = Array.from({ length: 24 }, (_, i) => i)
const MENIT = Array.from({ length: 60 }, (_, i) => i)

// Daftar diulang beberapa salinan supaya roda berputar tanpa ujung (23 lanjut ke 00, 59 lanjut ke 00).
// Posisi diam selalu dikembalikan ke salinan tengah, jadi tidak pernah sampai ke ujung daftar.
const SALINAN = 7
const TENGAH = 3

export default function TimeWheelPicker({ value, onChange }) {
  const [jamAwal, menitAwal] = value.split(':').map(Number)
  const jamRef = useRef(null)
  const menitRef = useRef(null)
  const timeoutRef = useRef(null)
  const abaikanRef = useRef(false)
  const lompatRef = useRef(null)
  // Angka yang sedang berada di baris tengah, dipakai untuk menandai angka aktif dan membunyikan klik.
  const [pusat, setPusat] = useState({ jam: jamAwal, menit: menitAwal })
  const pusatRef = useRef(pusat)

  useEffect(() => {
    if (jamRef.current) jamRef.current.scrollTop = (TENGAH * JAM.length + jamAwal) * ITEM_HEIGHT
    if (menitRef.current) menitRef.current.scrollTop = (TENGAH * MENIT.length + menitAwal) * ITEM_HEIGHT
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleScroll(ref, panjangList, tipe) {
    const el = ref.current
    if (!el || abaikanRef.current) return

    // Angka di tengah diperbarui selama menggulung, dan tiap pergantian angka berbunyi satu klik.
    const mentah = Math.min(Math.max(Math.round(el.scrollTop / ITEM_HEIGHT), 0), panjangList * SALINAN - 1)
    const langsung = mentah % panjangList
    if (pusatRef.current[tipe] !== langsung) {
      pusatRef.current = { ...pusatRef.current, [tipe]: langsung }
      setPusat(pusatRef.current)
      playJamTik()
    }

    clearTimeout(timeoutRef.current)
    clearTimeout(lompatRef.current)
    timeoutRef.current = setTimeout(() => {
      el.scrollTo({ top: mentah * ITEM_HEIGHT, behavior: 'smooth' })
      // Setelah berhenti, lompat diam-diam ke salinan tengah supaya selalu ada ruang di atas dan di bawah
      lompatRef.current = setTimeout(() => {
        const sasaran = (TENGAH * panjangList + langsung) * ITEM_HEIGHT
        if (Math.abs(el.scrollTop - sasaran) < ITEM_HEIGHT * panjangList / 2) return
        abaikanRef.current = true
        el.scrollTop = sasaran
        setTimeout(() => { abaikanRef.current = false }, 80)
      }, 320)

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
      {Array.from({ length: SALINAN }, () => data).flat().map((n, i) => (
        <div key={i} style={n === aktif ? s.itemAktif : s.item}>
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
