import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { playSambutKonsol } from '../lib/sound'

// Sambutan hanya sekali tiap app dibuka (bukan tiap pindah tab)
let sudahDisambut = false

// Layar konsol ojek saat siaga. Pertama kali app dibuka: sambutan WELCOME BACK + nama yang diketik huruf demi huruf,
// lalu berganti dengan efek glitch ke tampilan jam: hari dan tanggal + keterangan di kiri, jam besar di kanan.
export default function JamKonsol({ keterangan }) {
  const { lang, t } = useLanguage()
  const { isDemo } = useAuth()
  const [sekarang, setSekarang] = useState(() => new Date())
  const [sambut, setSambut] = useState(() => !sudahDisambut)
  const [hurufNama, setHurufNama] = useState(0)
  const [dariSambut, setDariSambut] = useState(false)
  const nama = (isDemo ? t.namaDemo : 'Ahyan').toUpperCase()

  useEffect(() => {
    const id = setInterval(() => setSekarang(new Date()), 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!sambut) return undefined
    sudahDisambut = true
    playSambutKonsol()
    let n = 0
    const ketik = setInterval(() => {
      n += 1
      setHurufNama(n)
      if (n >= nama.length) clearInterval(ketik)
    }, 110)
    const selesai = setTimeout(() => { setSambut(false); setDariSambut(true) }, 600 + nama.length * 110 + 1400)
    return () => { clearInterval(ketik); clearTimeout(selesai) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (sambut) {
    return (
      <div className="muncul-sambut" style={s.sambut}>
        <div style={s.kecil}>{t.sambutanKonsol}</div>
        <div style={s.nama}>
          {nama.slice(0, hurufNama)}
          <span className="kolon-kedip" style={s.kursor} />
        </div>
      </div>
    )
  }

  const tanggal = sekarang
    .toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/,/g, '')
    .toUpperCase()
  const jam = String(sekarang.getHours()).padStart(2, '0')
  const menit = String(sekarang.getMinutes()).padStart(2, '0')

  return (
    <div key="jam" className={dariSambut ? 'glitch-masuk' : undefined} style={{ ...s.baris, animationDelay: '0s' }}>
      <div style={s.kiri}>
        <div style={s.kecil}>{tanggal}</div>
        <div style={{ ...s.kecil, marginTop: 5 }}>{keterangan}</div>
      </div>
      <div style={s.jam} aria-label={`${jam}:${menit}`}>
        {jam}
        <span className="kolon-kedip">:</span>
        {menit}
      </div>
    </div>
  )
}

const s = {
  sambut: { minHeight: 30 },
  nama: { fontSize: 22, lineHeight: 1, color: '#FFFFFF', marginTop: 5, textShadow: '0 0 8px rgba(148, 221, 244, 0.6)', display: 'flex', alignItems: 'center', gap: 3 },
  kursor: { display: 'inline-block', width: 10, height: 18, background: '#94DDF4' },
  baris: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  kiri: { minWidth: 0 },
  kecil: { fontSize: 10, letterSpacing: '0.06em', opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  jam: { fontSize: 28, lineHeight: 1, color: '#FFFFFF', letterSpacing: '0.04em', textShadow: '0 0 8px rgba(148, 221, 244, 0.6)', flexShrink: 0 },
}
