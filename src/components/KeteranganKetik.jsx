import { useEffect, useState } from 'react'

const KETIK = 110 // ms per huruf saat diketik (pelan supaya tidak pusing)
const HAPUS = 65 // ms per huruf saat dihapus
const JEDA = 400 // ms kosong sebelum pesan berikutnya
const SIKLUS = 8000 // ms tiap pesan, dari mulai diketik sampai pesan berikutnya mulai; sisanya dipakai untuk menahan pesan terbaca

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
    const id = setInterval(() => setSekarang(Date.now()), 50)
    return () => clearInterval(id)
  }, [])

  // Tiap pesan tepat SIKLUS ms: ketik, ditahan (sisa waktu), dihapus, jeda
  const posisi = sekarang % (SIKLUS * daftar.length)
  const indeks = Math.floor(posisi / SIKLUS)
  const sisa = posisi - indeks * SIKLUS
  const pesan = daftar[indeks]
  const TAHAN = Math.max(0, SIKLUS - pesan.length * (KETIK + HAPUS) - JEDA)
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
