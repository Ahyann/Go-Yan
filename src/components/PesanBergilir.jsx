import { useEffect, useState } from 'react'

const DURASI = 4200 // ms tiap pesan: diketik, diam, lalu berganti
const KETIK = 45 // ms per huruf

// Pengganti tulisan berjalan di konsol ojek: satu pesan pendek diketik huruf demi huruf, diam sebentar, lalu
// berganti ke pesan berikutnya. Posisinya dihitung dari jam, jadi pindah tab tidak mengulang dari awal.
export default function PesanBergilir({ teks }) {
  const daftar = teks.split('▪').map((x) => x.trim()).filter(Boolean)
  const [sekarang, setSekarang] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setSekarang(Date.now()), KETIK)
    return () => clearInterval(id)
  }, [])

  const indeks = Math.floor(sekarang / DURASI) % daftar.length
  const pesan = daftar[indeks] || ''
  const lewat = sekarang % DURASI
  const huruf = Math.min(pesan.length, Math.floor(lewat / KETIK))
  const selesaiKetik = huruf >= pesan.length

  return (
    <span style={s.baris}>
      <span style={s.tanda}>&gt;</span>
      <span>{pesan.slice(0, huruf)}</span>
      <span className={selesaiKetik ? 'kolon-kedip' : undefined} style={s.kursor} />
    </span>
  )
}

const s = {
  baris: { display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' },
  tanda: { opacity: 0.6 },
  kursor: { display: 'inline-block', width: 6, height: 10, background: 'currentColor' },
}
