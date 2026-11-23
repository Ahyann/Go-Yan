import { useEffect, useMemo, useRef, useState } from 'react'
import { GAMBAR, KOLOM } from './SplashLabaLaba.jsx'
import { playTabPindah } from '../lib/sound'
import { getar } from '../lib/getar'

const BARIS = GAMBAR.length

// Logo laba-laba piksel besar di ruang kosong bawah halaman login. Dipencet: cahaya putih menyebar dari titik
// yang dipencet ke seluruh kotak logo. Ukuran kotak menyesuaikan ruang yang tersisa; kalau ruangnya terlalu
// sempit (HP pendek), logo tidak ditampilkan supaya tidak menabrak form.
export default function LogoLabaSentuh({ style }) {
  const refWadah = useRef(null)
  const refKotak = useRef([])
  const [sk, setSk] = useState(0)

  const kotak = useMemo(() => {
    const hasil = []
    GAMBAR.forEach((baris, r) => {
      for (let c = 0; c < KOLOM; c++) {
        if (baris[c] === '#' || baris[KOLOM - 1 - c] === '#') hasil.push({ r, c })
      }
    })
    return hasil
  }, [])

  useEffect(() => {
    const el = refWadah.current
    if (!el) return undefined
    const ukur = () => {
      const { width, height } = el.getBoundingClientRect()
      const ukuran = Math.floor(Math.min((width * 0.8) / KOLOM, (height * 0.86) / BARIS, 12))
      setSk(ukuran >= 5 ? ukuran : 0)
    }
    ukur()
    const pengamat = new ResizeObserver(ukur)
    pengamat.observe(el)
    return () => pengamat.disconnect()
  }, [])

  function sentuh(e) {
    if (!sk) return
    const grid = e.currentTarget.getBoundingClientRect()
    const pc = Math.max(0, Math.min(KOLOM - 1, (e.clientX - grid.left) / sk))
    const pr = Math.max(0, Math.min(BARIS - 1, (e.clientY - grid.top) / sk))
    playTabPindah()
    getar(8)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    kotak.forEach((k, i) => {
      const node = refKotak.current[i]
      if (!node) return
      const jarak = Math.hypot(k.c + 0.5 - pc, k.r + 0.5 - pr)
      node.animate(
        [
          { background: '#5ED0FF', opacity: 0.35, transform: 'scale(1)' },
          { background: '#FFFFFF', opacity: 1, transform: 'scale(1.25)', offset: 0.35 },
          { background: '#5ED0FF', opacity: 0.35, transform: 'scale(1)' },
        ],
        { duration: 520, delay: jarak * 28, easing: 'ease-out' },
      )
    })
  }

  return (
    <div ref={refWadah} style={{ ...s.wadah, ...style }}>
      {sk > 0 && (
        <div
          role="img"
          aria-label="Go-Yan"
          onPointerDown={sentuh}
          style={{ ...s.grid, width: KOLOM * sk, height: BARIS * sk }}
        >
          {kotak.map((k, i) => (
            <span
              key={`${k.r}-${k.c}`}
              ref={(n) => { refKotak.current[i] = n }}
              style={{ ...s.kotak, left: k.c * sk, top: k.r * sk, width: sk, height: sk }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  wadah: { flex: '1 1 auto', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  grid: { position: 'relative', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' },
  kotak: { position: 'absolute', background: '#5ED0FF', opacity: 0.35 },
}
