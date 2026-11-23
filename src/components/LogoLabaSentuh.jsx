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

  // terbang: logo meluncur ke tengah layar sambil membesar. Supaya halus di HP, yang dianimasikan hanya transform
  // (dikerjakan GPU). Supaya tajam, logo langsung digambar ulang di ukuran AKHIR, lalu dimulai dari skala kecil
  // (sama persis dengan ukuran semula) dan berakhir di skala 1, jadi di akhir tidak ada garis sambungan antarkotak.
  useEffect(() => {
    const el = refGrid.current
    if (!terbang || !el || !sk) return
    // logo melayang di tengah wadahnya, jadi geseran dihitung dari titik tengah wadah ke titik tujuan
    const w = refWadah.current.getBoundingClientRect()
    // di layar lebar app tampil sebagai kolom 430px; layar loading (position: fixed) mengikuti kolom itu, bukan jendela
    const kolom = document.getElementById('root')
    const lebar = kolom ? kolom.clientWidth : window.innerWidth
    const kiriKolom = kolom ? kolom.getBoundingClientRect().left : 0
    const tinggi = window.innerHeight
    const skTujuan = Math.max(8, Math.min(Math.floor((lebar * 0.9) / KOLOM), Math.floor((tinggi * 0.62) / BARIS)))
    const geserX = Math.round(kiriKolom + lebar / 2 - (w.left + w.width / 2))
    const geserY = Math.round(tinggi * 0.47 - (w.top + w.height / 2))
    const px = (n) => n + "px"
    el.style.width = px(KOLOM * skTujuan)
    el.style.height = px(BARIS * skTujuan)
    el.style.willChange = "transform"
    kotak.forEach((k, i) => {
      const n = refKotak.current[i]
      if (!n) return
      n.style.left = px(k.c * skTujuan)
      n.style.top = px(k.r * skTujuan)
      n.style.width = px(skTujuan)
      n.style.height = px(skTujuan)
    })
    const kurangGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(' + sk / skTujuan + ')' },
        { transform: 'translate(-50%, -50%) translate(' + px(geserX) + ', ' + px(geserY) + ') scale(1)' },
      ],
      { duration: kurangGerak ? 1 : 600, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' },
    )
  }, [terbang, sk, kotak])

  // glitch sesekali (tiap 5-8 dtk acak): beberapa pita baris kotak bergeser ke samping dan berkedip merah/putih
  // sebentar, seperti sinyal TV yang terganggu. Hanya transform dan opacity, jadi ringan. Berhenti saat logo terbang.
  useEffect(() => {
    if (!sk || terbang) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    let id
    const jadwal = () => {
      id = setTimeout(() => { glitch(); jadwal() }, 5000 + Math.random() * 3000)
    }
    jadwal()
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sk, terbang])

  function glitch() {
    if (document.hidden) return
    const pita = []
    const jumlah = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < jumlah; i++) {
      const mulai = Math.floor(Math.random() * BARIS)
      pita.push({ dari: mulai, sampai: mulai + 1 + Math.floor(Math.random() * 4), geser: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 3)), warna: Math.random() < 0.5 ? '#FF5A5A' : '#FFFFFF' })
    }
    kotak.forEach((k, i) => {
      const node = refKotak.current[i]
      if (!node) return
      const p = pita.find((x) => k.r >= x.dari && k.r < x.sampai)
      if (!p) {
        node.animate([{ opacity: 0.35 }, { opacity: 0.08, offset: 0.25 }, { opacity: 0.6, offset: 0.5 }, { opacity: 0.35 }], { duration: 340, easing: 'steps(1, end)' })
        return
      }
      const g = p.geser * sk
      node.animate(
        [
          { transform: 'translateX(0)', background: '#5ED0FF', opacity: 0.35 },
          { transform: `translateX(${g}px)`, background: p.warna, opacity: 1, offset: 0.15 },
          { transform: `translateX(${-g / 2}px)`, background: '#5ED0FF', opacity: 0.6, offset: 0.5 },
          { transform: `translateX(${g / 2}px)`, background: p.warna, opacity: 0.8, offset: 0.7 },
          { transform: 'translateX(0)', background: '#5ED0FF', opacity: 0.35 },
        ],
        { duration: 340, easing: 'steps(1, end)' },
      )
    })
  }

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
