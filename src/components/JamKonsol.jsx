import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import KeteranganKetik from './KeteranganKetik.jsx'
import { playSambutGlitch, playKonsolMati, playSambutKonsol, bunyikanSetelahSiap } from '../lib/sound'

// Status sambutan selama app terbuka: null (belum), 'tunggu' (WELCOME sudah tampil, menunggu diketuk), 'selesai'.
// Pindah tab sebelum diketuk tetap menampilkan WELCOME + TAP HERE; sesudah diketuk langsung jam.
let statusSambut = null
const pendengarSelesai = new Set()
export const sambutSudahSelesai = () => statusSambut === 'selesai'
// OjekView memakai ini: sebelum sambutan diketuk semua tab menampilkan WELCOME; sesudahnya tiap tab memakai layarnya sendiri
export function dengarSambutSelesai(fn) {
  pendengarSelesai.add(fn)
  return () => pendengarSelesai.delete(fn)
}

const KATA = 'WELCOME'
const MULAI = 100 // ms sebelum huruf pertama
const PER_HURUF = 50 // ms tiap huruf diketik
const NAMA_PADA = MULAI + KATA.length * PER_HURUF + 60 // nama muncul sesudah WELCOME lengkap
const TAP_PADA = NAMA_PADA + 250 // tulisan TAP HERE muncul; sambutan menunggu sampai layar diketuk
const MATI_SESUDAH_TAP = 700 // glitch dulu, lalu layar "dimatikan" jadi garis tipis
const SELESAI_SESUDAH_TAP = MATI_SESUDAH_TAP + 380 // lalu tampilan jam "dinyalakan" dari garis tipis

// Layar konsol ojek saat siaga. Pertama kali app dibuka: WELCOME diketik huruf demi huruf (tanpa suara), nama naik
// menyusul, lalu muncul TAP HERE. Saat layar diketuk (baru di sini ada suara) keduanya glitch sekali. Sesudah itu layar mengecil jadi garis seperti TV dimatikan, dan tampilan jam
// menyala dari garis yang sama (hari dan tanggal + keterangan di kiri, jam besar di kanan, baris status di bawah).
// lewatiSambut: sudah ada pesanan, jadi WELCOME tidak ditampilkan dan konsol langsung ke tampilan jam
export default function JamKonsol({ keterangan, bergilir = false, bawah = null, lewatiSambut = false }) {
  if (lewatiSambut) statusSambut = 'selesai'
  const { lang, t } = useLanguage()
  const { isDemo } = useAuth()
  const [sekarang, setSekarang] = useState(() => new Date())
  const [fase, setFase] = useState(() => (statusSambut === 'selesai' ? 'jam' : statusSambut === 'tunggu' ? 'tunggu' : 'ketik')) // ketik | tunggu | glitch | mati | jam
  const [huruf, setHuruf] = useState(() => (statusSambut === 'tunggu' ? KATA.length : 0))
  const [dariSambut, setDariSambut] = useState(false)
  const nama = (isDemo ? t.namaDemo : 'Ahyan').toUpperCase()

  // Pesanan masuk saat WELCOME masih tampil: langsung pindah ke jam
  useEffect(() => {
    if (lewatiSambut && fase !== 'jam') setFase('jam')
  }, [lewatiSambut, fase])

  useEffect(() => {
    const id = setInterval(() => setSekarang(new Date()), 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (fase !== 'ketik') return undefined
    const timer = []
    for (let i = 1; i <= KATA.length; i++) {
      timer.push(setTimeout(() => setHuruf(i), MULAI + (i - 1) * PER_HURUF))
    }
    timer.push(setTimeout(() => { setFase('tunggu'); statusSambut = 'tunggu' }, TAP_PADA))
    return () => timer.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function lanjut() {
    if (fase !== 'tunggu') return
    statusSambut = 'selesai'
    setFase('glitch')
    // Ketukan ini sering jadi sentuhan pertama di app; audio dibangunkan dulu supaya suaranya tidak hilang
    bunyikanSetelahSiap(() => { playSambutKonsol(); playSambutGlitch() })
    setTimeout(() => { setFase('mati'); playKonsolMati() }, MATI_SESUDAH_TAP)
    setTimeout(() => { setFase('jam'); setDariSambut(true); pendengarSelesai.forEach((f) => f()) }, SELESAI_SESUDAH_TAP)
  }

  if (fase !== 'jam') {
    const sudahLengkap = huruf >= KATA.length
    return (
      <div
        className={fase === 'mati' ? 'tv-mati' : undefined}
        style={{ ...s.sambut, cursor: fase === 'tunggu' ? 'pointer' : 'default' }}
        onClick={lanjut}
        role={fase === 'tunggu' ? 'button' : undefined}
        data-tanpa-suara
      >
        {fase === 'tunggu' && <span className="kolon-kedip" style={s.tap}>{t.tapLanjut} ▸</span>}
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
          <div style={{ ...s.kecil, marginTop: 5, ...(bergilir ? s.kecilKetik : null) }}>
            {bergilir ? <KeteranganKetik label={keterangan} daftar={t.pesanSiaga.split('▪').map((x) => x.trim()).filter(Boolean)} /> : keterangan}
          </div>
        </div>
        <div style={s.jam} aria-label={`${jam}:${menit}`}>
          {jam}
          <span className="kolon-kedip">:</span>
          {menit}
        </div>
      </div>
      {bawah && <div style={s.bawah}>{bawah}</div>}
    </div>
  )
}

const s = {
  sambut: { position: 'relative', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -4 },
  tap: { position: 'absolute', right: 0, bottom: -4, fontSize: 9, letterSpacing: '0.1em', color: '#FFFFFF' },
  sambutIsi: { textAlign: 'center' },
  welcome: { fontFamily: 'var(--font-judul)', fontSize: 38, lineHeight: 1, letterSpacing: '1px', color: '#FFFFFF', textShadow: '0 0 10px rgba(148, 221, 244, 0.65)' },
  namaSambut: { fontSize: 12, letterSpacing: '0.18em', color: '#5ED0FF', marginTop: 5 },
  baris: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  kiri: { minWidth: 0 },
  kecil: { fontSize: 10, letterSpacing: '0.06em', opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  kecilKetik: { opacity: 1, marginTop: 1, height: 17, display: 'flex', alignItems: 'center' },
  jam: { fontSize: 28, lineHeight: 1, color: '#FFFFFF', letterSpacing: '0.04em', textShadow: '0 0 8px rgba(148, 221, 244, 0.6)', flexShrink: 0 },
  bawah: { marginTop: 10 },
}
