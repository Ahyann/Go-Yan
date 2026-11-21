import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { playGeserTik, playSambutGlitch, playKonsolMati, playSambutKonsol } from '../lib/sound'

// Sambutan hanya sekali tiap app dibuka (bukan tiap pindah tab)
let sudahDisambut = false

const KATA = 'WELCOME'
const MULAI = 250 // ms sebelum huruf pertama
const PER_HURUF = 95 // ms tiap huruf diketik
const NAMA_PADA = MULAI + KATA.length * PER_HURUF + 150 // nama muncul sesudah WELCOME lengkap
const GLITCH_PADA = NAMA_PADA + 650 // glitch sesudah SEMUANYA masuk
const MATI_PADA = GLITCH_PADA + 1300 // layar "dimatikan" jadi garis tipis
const SELESAI_PADA = MATI_PADA + 380 // lalu tampilan jam "dinyalakan" dari garis tipis

// Layar konsol ojek saat siaga. Pertama kali app dibuka: WELCOME diketik huruf demi huruf, nama naik menyusul,
// lalu keduanya glitch sekali. Sesudah itu layar mengecil jadi garis seperti TV dimatikan, dan tampilan jam
// menyala dari garis yang sama (hari dan tanggal + keterangan di kiri, jam besar di kanan, pesan bergilir di bawah).
export default function JamKonsol({ keterangan, bawah = null }) {
  const { lang, t } = useLanguage()
  const { isDemo } = useAuth()
  const [sekarang, setSekarang] = useState(() => new Date())
  const [fase, setFase] = useState(() => (sudahDisambut ? 'jam' : 'ketik')) // ketik | glitch | mati | jam
  const [huruf, setHuruf] = useState(0)
  const [dariSambut, setDariSambut] = useState(false)
  const nama = (isDemo ? t.namaDemo : 'Ahyan').toUpperCase()

  useEffect(() => {
    const id = setInterval(() => setSekarang(new Date()), 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (fase !== 'ketik') return undefined
    sudahDisambut = true
    const timer = []
    for (let i = 1; i <= KATA.length; i++) {
      timer.push(setTimeout(() => { setHuruf(i); playGeserTik(i) }, MULAI + (i - 1) * PER_HURUF))
    }
    timer.push(setTimeout(() => playSambutKonsol(), NAMA_PADA))
    timer.push(setTimeout(() => { setFase('glitch'); playSambutGlitch() }, GLITCH_PADA))
    timer.push(setTimeout(() => { setFase('mati'); playKonsolMati() }, MATI_PADA))
    timer.push(setTimeout(() => { setFase('jam'); setDariSambut(true) }, SELESAI_PADA))
    return () => timer.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (fase !== 'jam') {
    const sudahLengkap = huruf >= KATA.length
    return (
      <div className={fase === 'mati' ? 'tv-mati' : undefined} style={s.sambut}>
        <div className={fase === 'glitch' ? 'sambut-glitch' : undefined} style={s.sambutIsi}>
          <div style={s.welcome}>
            {KATA.split('').map((c, i) => (
              <span key={i} style={{ visibility: i < huruf ? 'visible' : 'hidden' }}>{c}</span>
            ))}
          </div>
          <div className={sudahLengkap ? 'sambut-nama' : undefined} style={{ ...s.namaSambut, visibility: sudahLengkap ? 'visible' : 'hidden' }}>{nama}</div>
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
    <div className={dariSambut ? 'tv-nyala' : undefined}>
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
      {bawah && <div aria-hidden="true" style={s.bawah}>{bawah}</div>}
    </div>
  )
}

const s = {
  sambut: { height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -4 },
  sambutIsi: { textAlign: 'center' },
  welcome: { fontFamily: 'var(--font-judul)', fontSize: 38, lineHeight: 1, letterSpacing: '1px', color: '#FFFFFF', textShadow: '0 0 10px rgba(148, 221, 244, 0.65)' },
  namaSambut: { fontSize: 12, letterSpacing: '0.18em', color: '#5ED0FF', marginTop: 5 },
  baris: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  kiri: { minWidth: 0 },
  kecil: { fontSize: 10, letterSpacing: '0.06em', opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  jam: { fontSize: 28, lineHeight: 1, color: '#FFFFFF', letterSpacing: '0.04em', textShadow: '0 0 8px rgba(148, 221, 244, 0.6)', flexShrink: 0 },
  bawah: { marginTop: 8, fontSize: 11, letterSpacing: '0.06em', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden' },
}
