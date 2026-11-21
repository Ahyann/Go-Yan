import { useEffect, useState } from 'react'

const KETIK = 240 // ms per huruf saat diketik (pelan supaya tidak pusing)
const HAPUS = 140 // ms per huruf saat dihapus
const TAHAN = 8000 // ms pesan dibiarkan terbaca penuh
const JEDA = 500 // ms kosong sebelum pesan berikutnya

// Ikon Spiderman asli app (spidericon.png, latar transparan), dipasang tajam kotak-kotak langsung di layar
function KepalaSpidey() {
  return <img src={`${import.meta.env.BASE_URL}icons/spidericon.png`} alt="" aria-hidden="true" style={s.ikon} />
}

// Pengganti tulisan STANDBY di konsol ojek: kepala Spiderman, titik dua, lalu pesan yang diketik huruf demi huruf, ditahan,
// dihapus huruf demi huruf, dan diganti pesan berikutnya. Posisinya dihitung dari jam, jadi pindah tab tidak mengulang dari awal.
export default function KeteranganKetik({ daftar, label }) {
  const [sekarang, setSekarang] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setSekarang(Date.now()), 50)
    return () => clearInterval(id)
  }, [])

  // Lama tiap pesan: ketik + ditahan 8 detik + hapus + jeda
  const lama = daftar.map((p) => p.length * (KETIK + HAPUS) + TAHAN + JEDA)
  let sisa = sekarang % lama.reduce((x, y) => x + y, 0)
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
  ikon: { width: 16, height: 16, imageRendering: 'pixelated', display: 'block', flexShrink: 0 },
  baris: { display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%', whiteSpace: 'nowrap' },
  titik: { opacity: 0.65 },
  teks: { opacity: 0.85, minWidth: 0, overflow: 'hidden' },
  kursor: { display: 'inline-block', width: 5, height: 9, background: 'currentColor', opacity: 0.8, flexShrink: 0 },
}
