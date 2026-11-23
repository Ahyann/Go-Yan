import { useEffect, useMemo, useState } from 'react'
import { GAMBAR, KOLOM } from './SplashLabaLaba.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useTransisiDemo, selesaiTransisiDemo } from '../lib/transisiDemo'

const BARIS = GAMBAR.length
const LAMA_FOKUS = 650 // kaca dari buram ke bening

// Layar welcome akun demo, dipasang di tingkat App (di atas halaman login maupun app demo). Logo laba-laba besar di
// tengah (posisi dan ukurannya sama persis dengan logo yang baru terbang dari halaman login), kaca buram di
// belakangnya, dan tulisan welcome. Login demo berjalan di balik layar ini; begitu app demo siap, logo dan tulisan
// memudar lalu kacanya berubah dari buram ke bening, seperti kamera mencari fokus ke app.
export default function TransisiDemo() {
  const transisi = useTransisiDemo()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [fokus, setFokus] = useState(false)

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
    setFokus(false)
  }, [transisi])

  // begitu akun demo sudah login (app demo sudah ada di balik kaca), langsung masuk ke transisi fokus, tanpa menunggu
  useEffect(() => {
    if (transisi && !fokus && user) setFokus(true)
  }, [transisi, user, fokus])

  useEffect(() => {
    if (!fokus) return undefined
    const id = setTimeout(selesaiTransisiDemo, LAMA_FOKUS + 50)
    return () => clearTimeout(id)
  }, [fokus])

  if (!transisi) return null

  const lebar = window.innerWidth
  const tinggi = window.innerHeight
  const sk = Math.max(8, Math.min(Math.floor((lebar * 0.9) / KOLOM), Math.floor((tinggi * 0.62) / BARIS)))
  const kiri = Math.round(lebar / 2 - (KOLOM * sk) / 2)
  const atas = Math.round(tinggi * 0.47 - (BARIS * sk) / 2)
  const atasTeks = Math.min(atas + BARIS * sk + 34, tinggi - 130)
  const peran = (transisi.peran === 'ojek' ? t.demoOjek : t.demoPenumpang).toUpperCase()

  return (
    <div className={`td-lapis${fokus ? ' td-fokus' : ''}`} role="status">
      <div className="td-kaca" />
      <div className="td-isi" aria-hidden="true" style={{ position: 'absolute', left: kiri, top: atas, width: KOLOM * sk, height: BARIS * sk }}>
        {kotak.map((k) => (
          <span key={`${k.r}-${k.c}`} style={{ ...s.kotak, left: k.c * sk, top: k.r * sk, width: sk, height: sk }} />
        ))}
      </div>
      <div className="td-isi td-teks" style={{ ...s.teks, top: atasTeks }}>
        <div style={s.judul}>{t.demoSelamatDatangJudul}</div>
        <div style={s.sub}>{peran}</div>
        <div className="td-titik" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </div>
  )
}

const bayang = '0 1px 3px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 0.9)'
const s = {
  kotak: { position: 'absolute', background: '#5ED0FF', opacity: 0.35 },
  teks: { position: 'absolute', left: 16, right: 16, textAlign: 'center' },
  // sama dengan judul dan sub di layar menunggu ojek (SpideyMenunggu)
  judul: { fontFamily: 'var(--font-judul)', fontSize: 32, letterSpacing: 1, lineHeight: 1, color: '#FFFFFF', textShadow: bayang },
  sub: { fontFamily: 'var(--font-data)', fontSize: 12, letterSpacing: '0.08em', color: '#E8EDF9', marginTop: 8, textShadow: bayang },
}
