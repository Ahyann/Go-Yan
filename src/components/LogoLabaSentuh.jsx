import { useEffect, useMemo, useRef, useState } from 'react'
import { GAMBAR, KOLOM } from './SplashLabaLaba.jsx'
import { playTabPindah } from '../lib/sound'
import { getar } from '../lib/getar'

const BARIS = GAMBAR.length

// Logo laba-laba piksel besar di ruang kosong bawah halaman login. Dipencet: cahaya putih menyebar dari titik
// yang dipencet ke seluruh kotak logo. Ukuran kotak menyesuaikan ruang yang tersisa; kalau ruangnya terlalu
// sempit (HP pendek), logo tidak ditampilkan supaya tidak menabrak form.
export default function LogoLabaSentuh({ style, pemicu = 0, terbang = false }) {
  const refWadah = useRef(null)
  const refGrid = useRef(null)
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
      // clientWidth/clientHeight = ukuran tata letak, tidak ikut transform. getBoundingClientRect ikut transform,
      // jadi kalau diukur saat animasi TV menyala (halaman masih gepeng setinggi garis) hasilnya hampir nol dan logo
      // tersembunyi; ResizeObserver juga tidak terpicu saat transform selesai, jadi logo tetap tidak muncul.
      const width = el.clientWidth
      const height = el.clientHeight
      const ukuran = Math.floor(Math.min((width * 0.8) / KOLOM, (height * 0.86) / BARIS, 12))
      // minimal 4px per kotak (logo setinggi 92px): cukup untuk iPhone mode app yang ruang bawahnya hanya sekitar 100-120px
      setSk(ukuran >= 4 ? ukuran : 0)
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
    gelombang(pc, pr)
  }

  // terbang: logo meluncur ke tengah layar sambil membesar. Yang dianimasikan posisi dan ukuran ASLI tiap kotak
  // (left/top/width/height), bukan transform scale. Scale membuat tepi tiap kotak dihaluskan browser, sehingga muncul
  // garis tipis di sambungan antarkotak dan logonya terlihat bertekstur aneh.
  useEffect(() => {
    const el = refGrid.current
    if (!terbang || !el || !sk) return
    // Logo selalu dipusatkan oleh wadahnya, jadi saat ukurannya membesar posisi dasarnya ikut bergeser. Karena itu
    // geseran dihitung dari titik TENGAH wadah ke titik tujuan, bukan dari pojok kiri atas logo.
    const w = refWadah.current.getBoundingClientRect()
    const lebar = window.innerWidth
    const tinggi = window.innerHeight
    const skTujuan = Math.max(8, Math.min(Math.floor((lebar * 0.9) / KOLOM), Math.floor((tinggi * 0.62) / BARIS)))
    const geserX = Math.round(lebar / 2 - (w.left + w.width / 2))
    const geserY = Math.round(tinggi * 0.47 - (w.top + w.height / 2))
    const kurangGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const lama = kurangGerak ? 1 : 600
    const opsi = { duration: lama, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
    const px = (n) => n + "px"
    el.animate(
      [
        { transform: 'translate(-50%, -50%)', width: px(KOLOM * sk), height: px(BARIS * sk) },
        { transform: 'translate(-50%, -50%) translate(' + px(geserX) + ', ' + px(geserY) + ')', width: px(KOLOM * skTujuan), height: px(BARIS * skTujuan) },
      ],
      opsi,
    )
    kotak.forEach((k, i) => {
      const n = refKotak.current[i]
      if (!n) return
      n.animate(
        [
          { left: px(k.c * sk), top: px(k.r * sk), width: px(sk), height: px(sk), background: "#5ED0FF", opacity: 0.35 },
          { left: px(k.c * skTujuan), top: px(k.r * skTujuan), width: px(skTujuan), height: px(skTujuan), background: "rgb(158, 230, 255)", opacity: 0.32 },
        ],
        opsi,
      )
    })
  }, [terbang, sk, kotak])

  // dipicu dari luar (misalnya saklar demo dipencet): gelombang dari tengah logo
  useEffect(() => {
    if (pemicu) gelombang(KOLOM / 2, BARIS / 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pemicu])

  function gelombang(pc, pr) {
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
          ref={refGrid}
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
  wadah: { flex: '1 1 auto', minHeight: 0, position: 'relative' },
  // logo melayang di tengah wadah (absolute), jadi saat membesar ia tidak ikut mendorong tinggi halaman
  grid: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' },
  kotak: { position: 'absolute', background: '#5ED0FF', opacity: 0.35 },
}
