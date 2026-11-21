import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'

// Layar konsol ojek saat siaga: hari dan tanggal + keterangan di kiri, jam besar dengan titik dua berkedip di kanan.
export default function JamKonsol({ keterangan }) {
  const { lang } = useLanguage()
  const [sekarang, setSekarang] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setSekarang(new Date()), 5000)
    return () => clearInterval(id)
  }, [])

  const tanggal = sekarang
    .toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/,/g, '')
    .toUpperCase()
  const jam = String(sekarang.getHours()).padStart(2, '0')
  const menit = String(sekarang.getMinutes()).padStart(2, '0')

  return (
    <div style={s.baris}>
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
  baris: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  kiri: { minWidth: 0 },
  kecil: { fontSize: 10, letterSpacing: '0.06em', opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  jam: { fontSize: 28, lineHeight: 1, color: '#FFFFFF', letterSpacing: '0.04em', textShadow: '0 0 8px rgba(148, 221, 244, 0.6)', flexShrink: 0 },
}
