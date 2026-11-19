import { useEffect, useMemo, useState } from 'react'

// Gambar laba-laba (dari desain Figma) sebagai grid pixel 18 x 23.
// '#' = kotak hitam. Sisi kiri dan kanan dibuat simetris lewat fungsi di bawah.
export const GAMBAR = [
  '...#..#....#..#...',
  '...#.#......#.#...',
  '..#..#......#..#..',
  '..#.#........#.#..',
  '.##.#........#.##.',
  '.##.#........#.##.',
  '.##..##.##.##..##.',
  '.####.######.####.',
  '.##..#.####.#..##.',
  '...##.######.##...',
  '#.#..#.####.#..#.#',
  '##...#.####.#...##',
  '##...#.####.#...##',
  '##...#..##..#...##',
  '##...#..##..#...##',
  '##...#......#...##',
  '.#...#......#...#.',
  '.#...##....##...#.',
  '..#...#....#...#..',
  '..#...#....#...#..',
  '...#..#....#..#...',
  '......#....#......',
  '.......#..#.......',
]
export const KOLOM = 18
const UKURAN = 14

// Tampil sekali tiap halaman dimuat. Refresh mengulang dari awal (variabel ini ikut
// ter-reset), sedangkan pindah tab lalu kembali ke Home tidak memunculkannya lagi.
let sudahTampil = false
const MULAI_KELUAR = 1250 // ms: laba-laba sudah utuh, mulai memudar
const SELESAI = 1650 // ms: overlay dilepas

// Angka acak yang selalu sama untuk kotak yang sama, jadi tidak berkedip tiap render.
function acak(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function bentukKotak() {
  const hasil = []
  GAMBAR.forEach((baris, r) => {
    for (let c = 0; c < KOLOM; c++) {
      const cermin = KOLOM - 1 - c
      if (baris[c] === '#' || baris[cermin] === '#') hasil.push({ r, c })
    }
  })
  return hasil
}

// Loading di dalam area peta: peta tertutup abu-abu, kotak-kotak hitam muncul satu
// per satu dari atas sampai membentuk laba-laba, lalu laba-laba membesar dan
// memudar menampilkan peta di belakangnya. Muncul tiap kali halaman di-refresh.
export default function SplashLabaLaba({ ukuran = UKURAN }) {
  const [tampil, setTampil] = useState(() => {
    if (sudahTampil) return false
    return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  })
  const [keluar, setKeluar] = useState(false)
  const kotak = useMemo(bentukKotak, [])

  useEffect(() => {
    if (!tampil) return
    sudahTampil = true
    const a = setTimeout(() => setKeluar(true), MULAI_KELUAR)
    const b = setTimeout(() => setTampil(false), SELESAI)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [tampil])

  if (!tampil) return null

  return (
    <div className={keluar ? 'splash splash-keluar' : 'splash'} style={s.overlay} role="status" aria-label="Memuat">
      <span className="splash-sapu" aria-hidden="true" />
      <div className="splash-panel" style={s.panel}>
        <div style={{ ...s.grid, gridTemplateColumns: `repeat(${KOLOM}, ${ukuran}px)`, gridTemplateRows: `repeat(${GAMBAR.length}, ${ukuran}px)` }}>
          {kotak.map(({ r, c }, i) => (
            <span
              key={`${r}-${c}`}
              className="splash-kotak"
              style={{
                ...s.kotak,
                width: ukuran,
                height: ukuran,
                gridRow: r + 1,
                gridColumn: c + 1,
                '--d': `${60 + r * 30 + Math.round(acak(i) * 90)}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  // Menutup area peta saja (bukan seluruh layar). Salam, status, dan dock
  // punya z-index lebih tinggi, jadi tetap kelihatan di atasnya.
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1050,
    backgroundColor: '#424445',
    // Tekstur garis layar + sudut sedikit gelap. Garisnya digerakkan lewat CSS (.splash).
    backgroundImage: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 5px), radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.08), rgba(0,0,0,0.25))',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {},
  grid: {
    display: 'grid',
    gridTemplateColumns: `repeat(${KOLOM}, ${UKURAN}px)`,
    gridTemplateRows: `repeat(${GAMBAR.length}, ${UKURAN}px)`,
  },
  kotak: { width: UKURAN, height: UKURAN },
}
