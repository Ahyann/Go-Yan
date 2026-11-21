import { useEffect, useState } from 'react'

const KETIK = 55 // ms per huruf saat diketik
const HAPUS = 28 // ms per huruf saat dihapus
const TAHAN = 2400 // ms pesan dibiarkan terbaca
const JEDA = 280 // ms kosong sebelum pesan berikutnya

// Ikon Spiderman asli app (spidericon.png) dipasang di sel kecil layar jadul: latar gelap, tepi cyan tipis, garis scan
function KepalaSpidey() {
  return (
    <span aria-hidden="true" style={s.sel}>
      <img src={`${import.meta.env.BASE_URL}icons/spidericon.png`} alt="" style={s.ikon} />
      <span style={s.scan} />
    </span>
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
  sel: { position: 'relative', width: 17, height: 17, boxSizing: 'border-box', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#04192A', border: '1px solid rgba(94, 208, 255, 0.45)', boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.5)', overflow: 'hidden' },
  ikon: { width: 13, height: 13, imageRendering: 'pixelated', display: 'block' },
  scan: { position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.28) 0 1px, transparent 1px 3px)', pointerEvents: 'none' },
  baris: { display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%', whiteSpace: 'nowrap' },
  titik: { opacity: 0.65 },
  teks: { opacity: 0.85, minWidth: 0, overflow: 'hidden' },
  kursor: { display: 'inline-block', width: 5, height: 9, background: 'currentColor', opacity: 0.8, flexShrink: 0 },
}
