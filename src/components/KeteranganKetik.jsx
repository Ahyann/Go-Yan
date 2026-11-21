import { useEffect, useState } from 'react'

const KETIK = 55 // ms per huruf saat diketik
const HAPUS = 28 // ms per huruf saat dihapus
const TAHAN = 2400 // ms pesan dibiarkan terbaca
const JEDA = 280 // ms kosong sebelum pesan berikutnya

// Kepala Spiderman piksel kecil (merah, mata putih, garis jaring gelap) yang menyatu dengan layar jadul
function KepalaSpidey() {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true" shapeRendering="crispEdges" style={{ flexShrink: 0, display: 'block' }}>
      <g fill="#ED1C24"><rect x="3" y="0" width="6" height="1" /><rect x="2" y="1" width="8" height="8" /><rect x="3" y="9" width="6" height="2" /></g>
      <g fill="#FFFFFF"><rect x="3" y="5" width="3" height="2" /><rect x="4" y="4" width="1" height="1" /><rect x="6" y="5" width="3" height="2" /><rect x="7" y="4" width="1" height="1" /></g>
      <g fill="#04192A"><rect x="6" y="1" width="1" height="3" /><rect x="3" y="3" width="1" height="1" /><rect x="8" y="3" width="1" height="1" /><rect x="2" y="8" width="8" height="1" /></g>
    </svg>
  )
}

// Pengganti tulisan STANDBY di konsol ojek: kepala Spiderman, titik dua, lalu pesan yang diketik huruf demi huruf, ditahan,
// dihapus huruf demi huruf, dan diganti pesan berikutnya. Posisinya dihitung dari jam, jadi pindah tab tidak mengulang dari awal.
export default function KeteranganKetik({ daftar, label }) {
  const [sekarang, setSekarang] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setSekarang(Date.now()), 30)
    return () => clearInterval(id)
  }, [])

  // Lama tiap pesan dalam satu putaran: ketik + tahan + hapus + jeda
  const lama = daftar.map((p) => p.length * KETIK + TAHAN + p.length * HAPUS + JEDA)
  const total = lama.reduce((a, b) => a + b, 0)
  let sisa = sekarang % total
  let indeks = 0
  while (indeks < daftar.length - 1 && sisa >= lama[indeks]) {
    sisa -= lama[indeks]
    indeks++
  }
  const pesan = daftar[indeks]
  const tKetik = pesan.length * KETIK
  let huruf
  if (sisa < tKetik) huruf = Math.floor(sisa / KETIK)
  else if (sisa < tKetik + TAHAN) huruf = pesan.length
  else huruf = Math.max(0, pesan.length - Math.floor((sisa - tKetik - TAHAN) / HAPUS))
  const diam = sisa >= tKetik && sisa < tKetik + TAHAN

  return (
    <span role="img" aria-label={label} style={s.baris}>
      <KepalaSpidey />
      <span aria-hidden="true" style={s.titik}>:</span>
      <span aria-hidden="true" style={s.teks}>{pesan.slice(0, huruf)}</span>
      <span aria-hidden="true" className={diam ? 'kolon-kedip' : undefined} style={s.kursor} />
    </span>
  )
}

const s = {
  baris: { display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%', whiteSpace: 'nowrap' },
  titik: { opacity: 0.65 },
  teks: { opacity: 0.85, minWidth: 0, overflow: 'hidden' },
  kursor: { display: 'inline-block', width: 5, height: 9, background: 'currentColor', opacity: 0.8, flexShrink: 0 },
}
