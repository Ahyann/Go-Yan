import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { playWhooshMasuk, playSpideySentuh } from '../lib/sound'
import { bentukKotak, KOLOM } from './SplashLabaLaba.jsx'

const KOTAK_LABA = bentukKotak()
const BARIS_LABA = 23

// Angka acak yang selalu sama untuk kotak yang sama.
function acak(i, k = 1) {
  const x = Math.sin(i * 91.7 + k * 13.3) * 43758.5453
  return x - Math.floor(x)
}

// Gaya tiap kotak logo (satuan = 1 kotak): arah meledak dari tengah saat masuk, arah melayang naik saat
// diterima, dan arah jatuh berputar saat dibatalkan, beserta jeda masing-masing supaya tidak serempak.
const GAYA_KOTAK = KOTAK_LABA.map(({ r, c }, n) => ({
  '--x': `${((c - 8.5) * -0.75).toFixed(2)}px`,
  '--y': `${((r - 11) * -0.75).toFixed(2)}px`,
  '--d-masuk': `${(0.3 + Math.hypot(r - 11, c - 8.5) * 0.05).toFixed(2)}s`,
  '--naik': `${(-14 - acak(n) * 11).toFixed(1)}px`,
  '--geser': `${((acak(n, 3) - 0.5) * 5).toFixed(1)}px`,
  '--d-ok': `${((22 - r) * 0.02).toFixed(2)}s`,
  '--jatuh': `${(22 + acak(n, 2) * 10).toFixed(1)}px`,
  '--putar': `${Math.round((acak(n, 7) - 0.5) * 240)}deg`,
  '--sisi': `${((acak(n, 8) - 0.5) * 6).toFixed(1)}px`,
  '--d-gagal': `${(acak(n, 5) * 0.5 + r * 0.01).toFixed(2)}s`,
}))

// Kartu "menunggu driver": Spiderman piksel (dari desain Figma) turun dari atas, menggantung
// sambil kepalanya menengok pelan dan gelembung titik-titik di sampingnya, di atas latar panel setengah
// transparan berlogo laba-laba.
// Saat pesanan diterima (prop `diterima`), gelembung jadi centang, tulisan berganti, lalu
// Spiderman tertarik ke atas keluar kartu. Saat dibatalkan (prop `dibatalkan`), gelembung
// jadi wajah sedih, kepala Spiderman tertunduk, warnanya memudar abu-abu lalu turun dan menghilang.

// Sprite 19 x 29, terbalik (kaki di atas, kepala di bawah). R merah, K hitam, N biru tua, W putih (mata).
const SPRITE = [
  '.......KKKKK.......',
  '......KRRRRRK......',
  '......KRRRRRK......',
  '.....KRRRRRRRK.....',
  '.....KRRRRRRRK.....',
  '....KRRRRRRRRRK....',
  '...KNRRRRRRRRRNK...',
  '..KNNNRRKKKRRNNNK..',
  '..KNNNNKKKKKNNNNK..',
  '..KNNNKKNKNKKNNNK..',
  '...KNKRRKKKRRKNK...',
  '....KRRRRKRRRRK....',
  '...KRRRRRKRRRRRK...',
  '..KRRRRRKRKRRRRRK..',
  '.KRRRNNKRKRKNNRRRK.',
  'KRRRNNKRRKRRKNNRRRK',
  'KRRNNKNRRRRRNKNNRRK',
  '.KRRNNRRKKKKKNNRRK.',
  '..KRRRRKRRRRRKRRK..',
  '...KKKKRRRRRRRKK...',
  '.....KRRRKKKRKKK...',
  '....KRRRKWWWKWWK...',
  '....KRRKWWWKRKWK...',
  '....KRRKWWKRRRKK...',
  '....KRRKKKRRRRRK...',
  '....KRRRRRRRRRRK...',
  '.....KRRRRRRRRK....',
  '......KRRRRRRK.....',
  '.......KKKKKK......',
]
const JANGKAR = [
  '#######',
  '.#####.',
  '..###..',
]
const KOTAK_MATA = [
  { r0: 20, r1: 24, c0: 7, c1: 12 },
  { r0: 20, r1: 22, c0: 13, c1: 14 },
]
const WARNA = { R: '#E20101', K: '#0A0A0A', N: '#0B2E5C', W: '#FFFFFF' }
const PAD = 12 // ruang kiri untuk gelembung
const LEBAR = 19
const TINGGI = SPRITE.length
const BARIS_KEPALA = 19
const SKALA = 6

function Kotak({ x, y, w = 1, h = 1, warna, className }) {
  return <rect x={x} y={y} width={w} height={h} fill={warna} className={className} />
}

function bagian(r0, r1) {
  const hasil = []
  for (let r = r0; r < r1; r++) {
    for (let c = 0; c < LEBAR; c++) {
      const ch = SPRITE[r][c]
      if (ch === '.') continue
      // Kotak di dalam area mata digambar merah sebagai dasar wajah; mata aslinya (putih + garis hitam) digambar
      // terpisah di atasnya supaya bisa mengecil dan menyisakan wajah merah polos.
      if (dalamMata(r, c)) hasil.push(<Kotak key={`${r}-${c}`} x={c + PAD} y={r} warna={WARNA.R} />)
      else if (ch !== 'W') hasil.push(<Kotak key={`${r}-${c}`} x={c + PAD} y={r} warna={WARNA[ch]} />)
    }
  }
  return hasil
}

function dalamMata(r, c) {
  return KOTAK_MATA.some((k) => r >= k.r0 && r <= k.r1 && c >= k.c0 && c <= k.c1)
}

// Satu mata = putih matanya beserta garis hitam di sekelilingnya. Saat berkedip seluruh mata ini mengecil
// tingginya saja (panjang tetap) jadi celah tipis, lalu kembali. Garis pembungkus kepala tidak ikut bergerak.
function mataSprite(k) {
  const hasil = []
  for (let r = k.r0; r <= k.r1; r++) {
    for (let c = k.c0; c <= k.c1; c++) {
      const ch = SPRITE[r][c]
      if (ch === 'W') hasil.push(<Kotak key={`m${r}-${c}`} x={c + PAD} y={r} warna="#FFFFFF" />)
      else if (ch === 'K') hasil.push(<Kotak key={`m${r}-${c}`} x={c + PAD} y={r} warna={WARNA.K} />)
    }
  }
  return hasil
}

function formatLama(ms) {
  const d = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`
}

// Reaksi saat Spiderman disentuh; yang dimainkan dipilih acak (satu putaran acak memuat semuanya sekali).
// Garis bergelombang "spider sense" yang memancar di sekeliling kepala (pusat kepala di x = PAD + 9.5, y = 24.5).
// Digambar dua kali dengan sedikit selisih warna (merah muda dan biru) supaya tampak bergeser seperti di komiknya.
const SENSE = (() => {
  const hasil = []
  for (let n = 0; n < 9; n++) {
    const sudut = (n * 40 + 10) * (Math.PI / 180)
    const dx = Math.cos(sudut)
    const dy = Math.sin(sudut)
    if (dy < -0.5) continue // yang mengarah ke badan dilewati, tertutup merah
    const titik = []
    for (let k = 0; k <= 4; k++) {
      const jarak = 7.5 + k
      const geser = (k % 2 ? 1 : -1) * 0.85 * (k === 0 || k === 4 ? 0.4 : 1)
      titik.push(`${(PAD + 9.5 + dx * jarak - dy * geser).toFixed(2)} ${(24.5 + dy * jarak + dx * geser).toFixed(2)}`)
    }
    hasil.push({ d: `M${titik.join(' L')}`, grup: n % 2 })
  }
  return hasil
})()

// Gelembung bertulisan saat disentuh: teks, ukuran huruf, dan tinggi garis dasar di dalam gelembung.
const TEKS_GEL = {
  haci: { teks: 'HACI!', ukuran: 2.3, y: 3.6 },
  zzz: { teks: 'Zzz', ukuran: 2.8, y: 3.7 },
  ok: { teks: 'OK!', ukuran: 2.7, y: 3.7 },
  e404: { teks: '404', ukuran: 2.7, y: 3.7 },
  nada: { teks: '♪♪', ukuran: 2.8, y: 3.7 },
  tanya: { teks: '?', ukuran: 3.6, y: 3.9 },
}

const REAKSI = [
  { nama: 'kaget', gelembung: 'seru', durasi: 700, easing: 'ease-out', kf: [{ transform: 'translateY(0)' }, { transform: 'translateY(-20px)', offset: 0.2 }, { transform: 'translateY(8px)', offset: 0.5 }, { transform: 'translateY(-4px)', offset: 0.75 }, { transform: 'translateY(0)' }] },
  { nama: 'senang', gelembung: 'hati', durasi: 750, easing: 'ease-out', kf: [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)', offset: 0.3 }, { transform: 'translateY(0)', offset: 0.55 }, { transform: 'translateY(-10px)', offset: 0.77 }, { transform: 'translateY(0)' }] },
  { nama: 'bersin', gelembung: 'haci', durasi: 1500, easing: 'ease-in-out', kf: [{ transform: 'rotate(0) translateY(0)' }, { transform: 'rotate(-2deg) translateY(10px)', offset: 0.3 }, { transform: 'rotate(3.5deg) translateY(-12px)', offset: 0.45 }, { transform: 'rotate(-1deg) translateY(4px)', offset: 0.65 }, { transform: 'rotate(0.4deg) translateY(0)', offset: 0.85 }, { transform: 'rotate(0) translateY(0)' }] },
  { nama: 'ngantuk', gelembung: 'zzz', durasi: 2400, easing: 'ease-in-out', kf: [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(22px) rotate(1deg)', offset: 0.35 }, { transform: 'translateY(22px) rotate(1deg)', offset: 0.55 }, { transform: 'translateY(-6px) rotate(0)', offset: 0.7 }, { transform: 'translateY(3px)', offset: 0.85 }, { transform: 'translateY(0) rotate(0)' }] },
  { nama: 'angguk', gelembung: 'ok', durasi: 1500, easing: 'ease-in-out', asal: 'badan', kf: [{ transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(12px) scaleY(0.93)', offset: 0.14 }, { transform: 'translateY(0) scaleY(1)', offset: 0.27 }, { transform: 'translateY(12px) scaleY(0.93)', offset: 0.41 }, { transform: 'translateY(0) scaleY(1)', offset: 0.54 }, { transform: 'translateY(12px) scaleY(0.93)', offset: 0.68 }, { transform: 'translateY(-3px) scaleY(1)', offset: 0.84 }, { transform: 'translateY(0) scaleY(1)' }] },
  { nama: 'glitch', gelembung: 'e404', durasi: 900, easing: 'linear', kf: [{ transform: 'none', filter: 'none', easing: 'steps(1, end)' }, { transform: 'translateX(-7px)', filter: 'hue-rotate(120deg) saturate(2)', offset: 0.06, easing: 'steps(1, end)' }, { transform: 'translateX(6px)', filter: 'invert(1)', offset: 0.17, easing: 'steps(1, end)' }, { transform: 'translateX(-3px)', filter: 'hue-rotate(240deg)', offset: 0.28, easing: 'steps(1, end)' }, { transform: 'translateX(8px) scaleX(1.06)', filter: 'none', offset: 0.39, easing: 'steps(1, end)' }, { transform: 'translateX(-5px)', filter: 'hue-rotate(60deg) saturate(3)', offset: 0.5, easing: 'steps(1, end)' }, { transform: 'translateX(3px)', filter: 'invert(1)', offset: 0.67, easing: 'steps(1, end)' }, { transform: 'translateX(-2px)', filter: 'none', offset: 0.83, easing: 'steps(1, end)' }, { transform: 'none', filter: 'none' }] },
  { nama: 'joget', gelembung: 'nada', durasi: 1900, easing: 'ease-in-out', kf: [{ transform: 'rotate(0) translateY(0)' }, { transform: 'rotate(1.8deg) translateY(-8px)', offset: 0.12 }, { transform: 'rotate(-1.8deg) translateY(0)', offset: 0.24 }, { transform: 'rotate(1.8deg) translateY(-8px)', offset: 0.37 }, { transform: 'rotate(-1.8deg) translateY(0)', offset: 0.49 }, { transform: 'rotate(1.8deg) translateY(-8px)', offset: 0.61 }, { transform: 'rotate(-1.8deg) translateY(0)', offset: 0.73 }, { transform: 'rotate(1deg) translateY(-4px)', offset: 0.85 }, { transform: 'rotate(0) translateY(0)' }] },
  { nama: 'bungee', gelembung: null, durasi: 2200, easing: 'linear', asal: 'badan', kf: [{ transform: 'translateY(0) scaleY(1)', easing: 'ease-in' }, { transform: 'translateY(58px) scaleY(1.12)', offset: 0.15, easing: 'ease-out' }, { transform: 'translateY(-16px) scaleY(0.94)', offset: 0.3, easing: 'ease-in-out' }, { transform: 'translateY(20px) scaleY(1.04)', offset: 0.45, easing: 'ease-in-out' }, { transform: 'translateY(-6px) scaleY(1)', offset: 0.6, easing: 'ease-in-out' }, { transform: 'translateY(7px)', offset: 0.74, easing: 'ease-in-out' }, { transform: 'translateY(-2px)', offset: 0.87, easing: 'ease-in-out' }, { transform: 'translateY(0) scaleY(1)' }] },
  { nama: 'intip', gelembung: 'tanya', durasi: 2600, easing: 'linear', kf: [{ transform: 'translateY(0)', easing: 'cubic-bezier(0.5, 0, 0.9, 0.4)' }, { transform: 'translateY(-130px)', offset: 0.11 }, { transform: 'translateY(-130px)', offset: 0.38, easing: 'ease-out' }, { transform: 'translateY(-70px) rotate(-1deg)', offset: 0.51 }, { transform: 'translateY(-70px) rotate(-1deg)', offset: 0.66, easing: 'ease-in-out' }, { transform: 'translateY(8px) rotate(0.4deg)', offset: 0.82 }, { transform: 'translateY(-3px)', offset: 0.91 }, { transform: 'translateY(0) rotate(0)' }] },
  { nama: 'sense', gelembung: 'sense', durasi: 1300, easing: 'linear', kf: [{ transform: 'rotate(0)', filter: 'none' }, { transform: 'rotate(-0.9deg)', filter: 'drop-shadow(2px 0 0 #4B5BFF) drop-shadow(-2px 0 0 #E8245C)', offset: 0.08 }, { transform: 'rotate(0.9deg)', filter: 'drop-shadow(-2px 0 0 #4B5BFF) drop-shadow(2px 0 0 #E8245C)', offset: 0.16 }, { transform: 'rotate(-0.9deg)', filter: 'drop-shadow(2px 0 0 #4B5BFF) drop-shadow(-2px 0 0 #E8245C)', offset: 0.24 }, { transform: 'rotate(0.9deg)', filter: 'drop-shadow(-2px 0 0 #4B5BFF) drop-shadow(2px 0 0 #E8245C)', offset: 0.32 }, { transform: 'rotate(-0.6deg)', filter: 'drop-shadow(2px 0 0 #4B5BFF) drop-shadow(-2px 0 0 #E8245C)', offset: 0.42 }, { transform: 'rotate(0.6deg)', filter: 'drop-shadow(-2px 0 0 #4B5BFF) drop-shadow(2px 0 0 #E8245C)', offset: 0.52 }, { transform: 'rotate(-0.3deg)', filter: 'drop-shadow(1px 0 0 #4B5BFF) drop-shadow(-1px 0 0 #E8245C)', offset: 0.66 }, { transform: 'rotate(0)', filter: 'none' }] },
  { nama: 'kenyal', gelembung: null, durasi: 900, easing: 'ease-out', kf: [{ transform: 'scaleY(1)' }, { transform: 'scaleY(1.18)', offset: 0.2 }, { transform: 'scaleY(0.86)', offset: 0.45 }, { transform: 'scaleY(1.08)', offset: 0.7 }, { transform: 'scaleY(0.97)', offset: 0.88 }, { transform: 'scaleY(1)' }] },
  { nama: 'getar', gelembung: 'titik', durasi: 550, easing: 'linear', kf: [{ transform: 'rotate(0)' }, { transform: 'rotate(-1.6deg)', offset: 0.12 }, { transform: 'rotate(1.6deg)', offset: 0.3 }, { transform: 'rotate(-1.6deg)', offset: 0.48 }, { transform: 'rotate(1.3deg)', offset: 0.66 }, { transform: 'rotate(-0.6deg)', offset: 0.85 }, { transform: 'rotate(0)' }] },
]

export default function SpideyMenunggu({ dibuatPada, diterima = false, dibatalkan = false, menyusut = false, isDemo = false, teks = null, gayaTolak = false }) {
  const { t } = useLanguage()
  const [sekarang, setSekarang] = useState(() => Date.now())

  // Whoosh jaring dibunyikan tepat saat badan Spiderman mulai terlihat masuk ke kartu. Posisinya dipantau tiap
  // frame (bukan timer), karena animasi jatuhnya bisa tertunda di HP dengan peta berat. Hanya satu bunyi, dan
  // hanya untuk pesanan yang baru dikirim (tidak diulang kalau app dibuka ulang saat masih menunggu).
  const refKartu = useRef(null)
  const refSpidey = useRef(null)
  const refReaksi = useRef(null)
  const reaksiTerakhir = useRef(-1)
  const antrianReaksi = useRef([])
  const timerGelembung = useRef(null)
  const [gelembungSentuh, setGelembungSentuh] = useState(null)
  useEffect(() => () => clearTimeout(timerGelembung.current), [])

  function sentuh() {
    const el = refReaksi.current
    if (!el || diterima || dibatalkan) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    // Urutan diacak per putaran: semua reaksi keluar sekali dulu sebelum ada yang diulang, jadi tidak ada yang terlewat.
    if (antrianReaksi.current.length === 0) {
      const urutan = REAKSI.map((_, n) => n)
      for (let n = urutan.length - 1; n > 0; n--) {
        const k = Math.floor(Math.random() * (n + 1))
        ;[urutan[n], urutan[k]] = [urutan[k], urutan[n]]
      }
      // reaksi terakhir putaran lalu jangan langsung muncul lagi di awal putaran baru
      if (urutan[urutan.length - 1] === reaksiTerakhir.current) [urutan[0], urutan[urutan.length - 1]] = [urutan[urutan.length - 1], urutan[0]]
      antrianReaksi.current = urutan
    }
    const i = antrianReaksi.current.pop()
    reaksiTerakhir.current = i
    const r = REAKSI[i]
    el.getAnimations().forEach((a) => a.cancel())
    el.style.transformOrigin = r.asal === 'badan' || r.nama === 'kenyal' ? `${(PAD + 9.5) * SKALA}px 26px` : `${(PAD + 9.5) * SKALA}px ${-topSpidey}px`
    el.animate(r.kf, { duration: r.durasi, easing: r.easing })
    playSpideySentuh(r.nama)
    clearTimeout(timerGelembung.current)
    setGelembungSentuh(r.gelembung)
    if (r.gelembung) timerGelembung.current = setTimeout(() => setGelembungSentuh(null), r.durasi + 500)
  }

  // Kartu memenuhi layar dari atas sampai tepat di atas dock. Tinggi dan lebarnya diukur dari peta di
  // belakangnya (kartu menempel di dasar overlay, jadi tingginya = jarak dari atas peta ke dasar overlay).
  const [ukuran, setUkuran] = useState({ tinggi: 560, lebar: 375, bawah: 86 })
  useLayoutEffect(() => {
    const overlay = refKartu.current?.offsetParent
    const peta = overlay?.offsetParent
    if (!overlay || !peta) return undefined
    const ukur = () => {
      // tinggi = seluruh tinggi peta; bawah = jarak dasar overlay ke dasar peta (area di balik dock)
      const tinggi = Math.round(peta.clientHeight)
      const lebar = Math.round(peta.clientWidth)
      const bawah = Math.max(0, tinggi - Math.round(overlay.offsetTop + overlay.offsetHeight))
      setUkuran((u) => (u.tinggi === tinggi && u.lebar === lebar && u.bawah === bawah ? u : { tinggi, lebar, bawah }))
    }
    ukur()
    const pengamat = new ResizeObserver(ukur)
    pengamat.observe(peta)
    return () => pengamat.disconnect()
  }, [])
  const { tinggi: tinggiPenuh, lebar: lebarPenuh, bawah: bawahDock } = ukuran
  // Satu kotak logo selebar mungkin (maks 90% lebar, 62% tinggi), Spiderman menggantung di seperlima atas.
  const sk = Math.max(8, Math.min(Math.floor((lebarPenuh * 0.9) / KOLOM), Math.floor((tinggiPenuh * 0.62) / BARIS_LABA)))
  const topSpidey = Math.round(tinggiPenuh * 0.2)
  const awalJatuh = -(topSpidey + 22 + TINGGI * SKALA + 40)
  useEffect(() => {
    if (!dibuatPada || Date.now() - dibuatPada > 8000) return undefined
    const mulai = performance.now()
    let frame = 0
    const pantau = () => {
      const gambar = refSpidey.current?.querySelector('svg')
      const kartu = refKartu.current
      if (gambar && kartu && gambar.getBoundingClientRect().bottom > kartu.getBoundingClientRect().top + 8) {
        playWhooshMasuk()
        return
      }
      if (performance.now() - mulai < 6000) frame = requestAnimationFrame(pantau)
    }
    frame = requestAnimationFrame(pantau)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const id = setInterval(() => setSekarang(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (diterima) playSpideySentuh('sense')
  }, [diterima])

  const lama = dibuatPada ? formatLama(sekarang - dibuatPada) : '00:00'
  // Latar kartu setengah transparan, jadi peta kelihatan di baliknya; bayangan teks menjaga tulisan tetap terbaca.
  const bayang = { textShadow: '0 1px 3px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 0.9)' }

  return (
    <div
      ref={refKartu}
      className={`sp-kartu${diterima ? ' sp-diterima' : ''}${dibatalkan ? ' sp-batal' : ''}${dibatalkan && gayaTolak ? ' sp-tolak' : ''}${menyusut ? ' sp-susut' : ''}`}
      style={{ ...s.kartu, height: menyusut ? 0 : tinggiPenuh, bottom: -bawahDock }}
      role="status"
    >
      {/* Logo laba-laba dari layar pembuka sebagai latar. Masuk: kotak meledak dari tengah. Diterima: menyala
          hijau lalu kotaknya melayang naik. Dibatalkan: memerah, bergetar, lalu kotaknya berjatuhan. */}
      <svg
        style={s.logoLatar}
        width={KOLOM * sk}
        height={BARIS_LABA * sk}
        viewBox={`0 0 ${KOLOM} ${BARIS_LABA}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <defs>
          {/* Pita cahaya bertepi lembut yang menyapu logo dari atas ke bawah (satu gradasi mulus, bukan per baris) */}
          <linearGradient id="sp-grad-pita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" />
            <stop offset="0.5" stopColor="#FFF" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="sp-mask-pita" maskUnits="userSpaceOnUse" x="0" y="-12" width={KOLOM} height={BARIS_LABA + 24}>
            <rect className="sp-pita" x="0" y="0" width={KOLOM} height="10" fill="url(#sp-grad-pita)" />
          </mask>
        </defs>
        {/* Kotak dibuat sedikit melebar (1,04) supaya tidak ada celah anti-alias berbentuk garis grid di antara kotak yang berdempetan. */}
        {KOTAK_LABA.map(({ r, c }, n) => (
          <rect
            key={`${r}-${c}`}
            className={diterima ? 'sp-laba-ok' : dibatalkan ? 'sp-laba-gagal' : 'sp-laba-masuk'}
            style={GAYA_KOTAK[n]}
            x={c - 0.02}
            y={r - 0.02}
            width="1.04"
            height="1.04"
            fill="#9EE6FF"
          />
        ))}
        {!diterima && !dibatalkan && (
          <g mask="url(#sp-mask-pita)" style={{ pointerEvents: 'none' }}>
            {KOTAK_LABA.map(({ r, c }) => <rect key={`p${r}-${c}`} x={c - 0.02} y={r - 0.02} width="1.04" height="1.04" fill="#FFFFFF" />)}
          </g>
        )}
      </svg>

      <div className="sp-kilau" style={{ opacity: diterima || dibatalkan ? 0 : 1 }} aria-hidden="true" />

      {/* Spiderman. Pembungkus diam; di dalamnya ada jangkar benang yang menempel di tepi atas kartu. */}
      <div style={s.pembungkus}>
      <div ref={refSpidey} className="sp-masuk" style={{ ...s.spidey, top: topSpidey, ...(dibatalkan && gayaTolak ? { transformOrigin: `${(PAD + 9.5) * SKALA}px ${-topSpidey}px` } : null), left: `calc(50% - ${(PAD + 9.5) * SKALA}px)`, '--awal': `${awalJatuh}px` }} aria-hidden="true">
        <div
          ref={refReaksi}
          onPointerDown={sentuh}
          style={{ position: 'relative', paddingTop: 22, transformOrigin: `${(PAD + 9.5) * SKALA}px ${-topSpidey}px`, pointerEvents: 'auto', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', cursor: 'pointer' }}
        >
        {/* Benang satu garis lurus dari jangkar sampai badan. Berada di dalam pembungkus reaksi, jadi saat berayun atau bergetar
            ia berputar bersama badan dengan poros di jangkar (tepi atas kartu), bukan patah di tengah. */}
        {/* Area sentuh tak kasatmata yang lebih luas dari gambar badan (sekitar 28px di tiap sisi), supaya mudah diketuk jari. */}
        <span style={{ position: 'absolute', left: PAD * SKALA - 28, top: 0, width: LEBAR * SKALA + 56, height: 22 + TINGGI * SKALA + 28 }} aria-hidden="true" />
        <svg className="sp-napas" width={(LEBAR + PAD) * SKALA} height={TINGGI * SKALA} viewBox={`0 0 ${LEBAR + PAD} ${TINGGI}`} shapeRendering="crispEdges" style={{ display: 'block', overflow: 'visible' }}>
          {bagian(0, BARIS_KEPALA)}
          {/* Benang menembus badan dari kaki turun 11 baris piksel ke badan (digambar di atas sprite, ikut bernapas bersama badan). */}
          
          <g className="sp-kepala">
            {bagian(BARIS_KEPALA, TINGGI)}
            {KOTAK_MATA.map((k, i) => <g key={i} className="sp-mata-kecil">{mataSprite(k)}</g>)}
          </g>
          {/* gelembung di kiri kepala: titik-titik saat menunggu, centang saat diterima, wajah sedih saat dibatalkan */}
          <g transform="translate(1 14)" opacity={gelembungSentuh === 'sense' ? 0 : 1}>
            <rect x="0" y="0" width="9" height="5" fill="#FFFFFF" />
            <rect x="-1" y="1" width="1" height="3" fill="#FFFFFF" />
            <rect x="9" y="1" width="1" height="3" fill="#FFFFFF" />
            <rect x="10" y="6" width="1" height="1" fill="#FFFFFF" />
            {diterima ? (
              <path d="M2.5 2.5h1v1h1v-1h1v-1h1v1h-1v1h-1v1h-1v-1h-1z" fill="#16A34A" />
            ) : dibatalkan ? (
              <>
                {/* silang merah: misi ditolak */}
                {gayaTolak ? (
                  <>
                    <rect x="3.5" y="1" width="1" height="1" fill="#E11D2E" /><rect x="5.5" y="1" width="1" height="1" fill="#E11D2E" />
                    <rect x="4.5" y="2" width="1" height="1" fill="#E11D2E" />
                    <rect x="3.5" y="3" width="1" height="1" fill="#E11D2E" /><rect x="5.5" y="3" width="1" height="1" fill="#E11D2E" />
                  </>
                ) : (
<>
                {/* wajah sedih */}
                <rect x="2.5" y="1.5" width="1" height="1" fill="#0A0A0A" />
                <rect x="5.5" y="1.5" width="1" height="1" fill="#0A0A0A" />
                <rect x="3" y="3.5" width="3" height="0.8" fill="#0A0A0A" />
                <rect x="2.4" y="4.1" width="0.8" height="0.6" fill="#0A0A0A" />
                <rect x="5.8" y="4.1" width="0.8" height="0.6" fill="#0A0A0A" />
              </>
                )}
              </>
            ) : gelembungSentuh === 'seru' ? (
              <>
                <rect x="4" y="0.8" width="1.2" height="2.6" fill="#BC1E2F" />
                <rect x="4" y="3.8" width="1.2" height="1" fill="#BC1E2F" />
              </>
            ) : gelembungSentuh === 'hati' ? (
              <path d="M2 1h2v1h1v-1h2v2h-1v1h-1v1h-1v-1h-1v-1h-1z" fill="#E20101" />
            ) : TEKS_GEL[gelembungSentuh] ? (
              <text x="4.5" y={TEKS_GEL[gelembungSentuh].y} fontSize={TEKS_GEL[gelembungSentuh].ukuran} fontWeight="700" textAnchor="middle" fill="#0A0A0A" style={{ fontFamily: 'var(--font-data)' }}>{TEKS_GEL[gelembungSentuh].teks}</text>
            ) : gelembungSentuh === 'titik' ? (
              <>
                <rect x="1.5" y="2" width="1" height="1" fill="#0A0A0A" />
                <rect x="4" y="2" width="1" height="1" fill="#0A0A0A" />
                <rect x="6.5" y="2" width="1" height="1" fill="#0A0A0A" />
              </>
            ) : (
              <>
                <rect className="sp-t1" x="1.5" y="2" width="1" height="1" fill="#0A0A0A" />
                <rect className="sp-t2" x="4" y="2" width="1" height="1" fill="#0A0A0A" />
                <rect className="sp-t3" x="6.5" y="2" width="1" height="1" fill="#0A0A0A" />
              </>
            )}
          </g>
          {(gelembungSentuh === 'sense' || diterima) && (
            <g className="sp-sense-g" fill="none" strokeLinecap="square" strokeLinejoin="miter">
              {SENSE.map((g, n) => (
                <g key={n} className={g.grup ? 'sp-sense-b' : 'sp-sense-a'}>
                  <path d={g.d} stroke="#4B5BFF" strokeWidth="0.6" transform="translate(0.5 0.35)" />
                  <path d={g.d} stroke="#E8245C" strokeWidth="0.6" />
                </g>
              ))}
            </g>
          )}
        </svg>
        <span className="sp-benang" style={s.benang} />
        </div>
      </div>
        {dibatalkan && !gayaTolak && (
          <div className="sp-air-w" style={{ position: 'absolute', top: topSpidey + 22 + 20 * SKALA, left: `calc(50% + ${5.4 * SKALA}px)` }} aria-hidden="true">
            <svg className="sp-air" width={3 * SKALA * 0.8} height={4 * SKALA * 0.8} viewBox="0 0 3 4" shapeRendering="crispEdges" style={{ display: 'block', overflow: 'visible' }}>
              <rect x="1" y="0" width="1" height="1" fill="#7FD4FF" /><rect x="0" y="1" width="3" height="2" fill="#7FD4FF" /><rect x="0.5" y="3" width="2" height="1" fill="#7FD4FF" /><rect x="0.5" y="1" width="1" height="1" fill="#E8F8FF" />
            </svg>
          </div>
        )}
      {/* Jangkar benang: bercak jaring piksel di tepi atas supaya ujung benang tampak menempel, bukan terpotong. */}
      <svg style={s.jangkar} width={JANGKAR[0].length * 4} height={JANGKAR.length * 4} viewBox={`0 0 ${JANGKAR[0].length} ${JANGKAR.length}`} shapeRendering="crispEdges" aria-hidden="true">
        {JANGKAR.flatMap((baris, r) => [...baris].map((ch, c) => (ch === '#' ? <rect key={`${r}-${c}`} x={c} y={r} width="1.04" height="1.04" fill="#E8E8E8" /> : null)))}
      </svg>
      </div>

      <div className="sp-teks-muncul" style={{ ...s.teks, bottom: 28 + bawahDock }}>
        <div style={{ ...s.judul, ...bayang, color: diterima ? '#4ADE80' : dibatalkan ? 'var(--merah-teks)' : '#FFFFFF' }}>
          {diterima ? (teks?.diterima ?? t.spideyDiterima) : dibatalkan ? (teks?.batal ?? t.spideyBatal) : (teks?.menunggu ?? t.spideyMenunggu)}
        </div>
        <div style={{ ...s.sub, ...bayang }}>
          {diterima ? (
            teks?.diterimaSub ?? (isDemo ? t.spideyMenujuDemo : t.spideyMenuju)
          ) : dibatalkan ? (
            teks?.batalSub ?? t.spideyBatalSub
          ) : (
            <>
              {teks?.menungguSub ?? (isDemo ? t.spideyBelumDemo : t.spideyBelum)} · <span style={{ color: 'var(--warn)' }}>{lama}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  jangkar: { position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.6))' },
  pembungkus: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  kartu: { position: 'absolute', bottom: 0, left: -14, right: -14, boxSizing: 'border-box', overflow: 'hidden', background: 'rgba(1, 42, 64, 0.58)', backdropFilter: 'blur(9px) saturate(1.2)', WebkitBackdropFilter: 'blur(9px) saturate(1.2)', transition: 'height 0.5s cubic-bezier(0.6, 0, 0.2, 1), bottom 0.5s cubic-bezier(0.6, 0, 0.2, 1), left 0.5s cubic-bezier(0.6, 0, 0.2, 1), right 0.5s cubic-bezier(0.6, 0, 0.2, 1)' },
  logoLatar: { overflow: 'visible', position: 'absolute', left: '50%', top: '47%', transform: 'translate(-50%, -50%)', opacity: 0.3 },
  // Poros (benang dan tengah badan) di kolom PAD + 9.5 sprite, diletakkan tepat di tengah kartu.
  spidey: { position: 'absolute', left: `calc(50% - ${(PAD + 9.5) * SKALA}px)`, top: 0 },
  // Benang dibuat sangat panjang ke atas (kartu yang memotongnya di tepi atas), jadi saat Spiderman
  // memantul turun atau jatuh masuk, benangnya tidak pernah putus atau menggantung pendek.
  benang: { position: 'absolute', left: (PAD + 9.5) * SKALA - 2, top: -2000, width: 4, height: 2088, background: '#E8E8E8', boxShadow: '0 0 4px rgba(94, 208, 255, 0.9)' },
  teks: { position: 'absolute', left: 0, right: 0, bottom: 28, textAlign: 'center' },
  judul: { fontFamily: 'var(--font-judul)', fontSize: 32, letterSpacing: 1, lineHeight: 1 },
  sub: { fontFamily: 'var(--font-data)', fontSize: 12, letterSpacing: '0.08em', color: '#E8EDF9', marginTop: 8 },
}
