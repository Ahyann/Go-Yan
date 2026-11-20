import { useLayoutEffect, useRef, useState } from 'react'

// Papan judul GO-YAN di tepi atas bingkai akun ojek. Dipasang sekali di OjekView supaya tetap tampil di semua tab
// (Home, Schedule, History, Account), bukan hanya di Home.
export default function PapanGoYan() {
  // Papan digeser supaya titik tengah KEPALA (bukan titik tengah papan) tepat di tengah layar.
  // "GO" lebih pendek dari "YAN", jadi tanpa ini kepala bergeser ke kiri.
  const papanRef = useRef(null)
  const kepalaRef = useRef(null)
  const [geser, setGeser] = useState(null)

  useLayoutEffect(() => {
    const ukur = () => {
      if (!papanRef.current || !kepalaRef.current) return
      setGeser(papanRef.current.clientLeft + kepalaRef.current.offsetLeft + kepalaRef.current.offsetWidth / 2)
    }
    ukur()
    document.fonts?.ready?.then(ukur)
  }, [])

  return (
    <div ref={papanRef} aria-hidden="true" style={{ ...s.papan, ...(geser != null ? { transform: `translateX(-${geser}px)` } : null) }}>
      <span className="glitch-teks" style={s.teks}><span aria-hidden="true" style={s.panah} />GO</span>
      <span ref={kepalaRef} style={s.kepala}>
        <span style={s.kepalaIsi}>
          <img src={`${import.meta.env.BASE_URL}icons/spidericon.png`} alt="" style={s.kepalaImg} />
          <span className="kelopak-spidey" style={{ left: '7%' }} />
          <span className="kelopak-spidey" style={{ left: '53%' }} />
        </span>
      </span>
      <span className="glitch-teks" style={s.teks}>YAN</span>
    </div>
  )
}

const s = {
  papan: {
    position: 'absolute',
    // 8px bingkai + 3px: papan menumpang di tepi atas layar di dalam bingkai (separuh masuk ke layar)
    top: 'calc(var(--safe-top) + 11px)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1200,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: 26,
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    background: 'linear-gradient(180deg, #1C5B8A, #0B3A5C)',
    border: '2px solid #04192A',
    boxShadow: 'inset 0 0 0 2px #9BDDFF, inset 0 -4px 0 rgba(0, 0, 0, 0.25), 3px 3px 0 #04192A',
    padding: '0 12px',
    pointerEvents: 'none',
  },
  // Panah play setinggi huruf GO, ikut bergeser saat glitch karena berada di dalam span GO. Sudut berundak ala piksel.
  panah: { display: 'inline-block', width: 9, height: 10, marginRight: 7, verticalAlign: 'baseline', background: 'currentColor', clipPath: 'polygon(0 0, 33% 0, 33% 20%, 67% 20%, 67% 40%, 100% 40%, 100% 60%, 67% 60%, 67% 80%, 33% 80%, 33% 100%, 0 100%)' },
  teks: { fontFamily: "'Silkscreen', monospace", fontSize: 15, letterSpacing: '0.08em', color: '#BFE9FF', lineHeight: 1 },
  // Kepala Spiderman saja, tanpa lingkaran putih
  kepala: { width: 40, height: 40, margin: '-8px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kepalaIsi: { position: 'relative', width: 40, height: 40 },
  kepalaImg: { width: 40, height: 40, imageRendering: 'pixelated', display: 'block' },
}
