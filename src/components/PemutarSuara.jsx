import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'

// Hanya satu pesan suara yang boleh berbunyi pada satu waktu: memutar yang baru menghentikan yang lama.
let hentikanYangAktif = null

export function formatDurasi(detik) {
  const d = Math.max(0, Math.round(detik || 0))
  return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}`
}

// Tinggi batang gelombang (0.25 - 1) dibuat dari "benih" tetap, jadi bentuk gelombang satu pesan selalu sama.
function buatGelombang(jumlah, benih) {
  return Array.from({ length: jumlah }, (_, i) => {
    const x = Math.sin(i * 12.9898 + benih) * 43758.5453
    return 0.25 + 0.75 * (x - Math.floor(x))
  })
}

// Pemutar pesan suara: ikon putar/jeda tanpa latar, gelombang suara berbatang, dan durasi.
// kecil: versi mungil gelap untuk di dalam bubble peta (di atas karakter).
// Bentuk biasa: berwarna cyan, untuk di dalam kotak chat.
export default function PemutarSuara({ src, durasi = 0, kecil = false }) {
  const { t } = useLanguage()
  const [main, setMain] = useState(false)
  const [progres, setProgres] = useState(0)
  const audioRef = useRef(null)
  const hentiRef = useRef(null)

  const jumlah = kecil ? 10 : 24
  const gelombang = useMemo(() => buatGelombang(jumlah, durasi * 7.13 + (src ? src.length % 97 : 0)), [jumlah, durasi, src])

  useEffect(
    () => () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (hentikanYangAktif === hentiRef.current) hentikanYangAktif = null
    },
    []
  )

  function henti() {
    audioRef.current?.pause()
    setMain(false)
  }
  hentiRef.current = henti

  function putar(e) {
    e.stopPropagation()
    if (main) {
      henti()
      return
    }
    if (hentikanYangAktif && hentikanYangAktif !== henti) hentikanYangAktif()
    hentikanYangAktif = henti
    let audio = audioRef.current
    if (!audio) {
      audio = new Audio(src)
      audio.ontimeupdate = () => {
        const total = audio.duration && Number.isFinite(audio.duration) ? audio.duration : durasi
        setProgres(total ? Math.min(1, audio.currentTime / total) : 0)
      }
      audio.onended = () => {
        setMain(false)
        setProgres(0)
        audio.currentTime = 0
      }
      audioRef.current = audio
    }
    audio.play().then(() => setMain(true)).catch((err) => {
      console.error('Gagal memutar pesan suara:', err)
      setMain(false)
    })
  }

  const warna = kecil ? '#0B0E1A' : 'var(--glow-blue)'
  const tinggiMaks = kecil ? 10 : 18
  const ikon = kecil ? 10 : 16
  const batangDimainkan = Math.round(progres * jumlah)

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: kecil ? 4 : 7, pointerEvents: 'auto', verticalAlign: 'middle' }}>
      <button
        type="button"
        onClick={putar}
        aria-label={main ? t.ariaJedaSuara : t.ariaPutarSuara}
        style={{ width: ikon + 6, height: ikon + 6, flexShrink: 0, padding: 0, border: 'none', background: 'transparent', color: warna, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        {main ? (
          <svg width={ikon} height={ikon} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <rect x="2" y="1" width="3" height="10" />
            <rect x="7" y="1" width="3" height="10" />
          </svg>
        ) : (
          <svg width={ikon} height={ikon} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M2 1l9 5-9 5z" />
          </svg>
        )}
      </button>
      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 1, height: tinggiMaks }}>
        {gelombang.map((h, i) => (
          <span
            key={i}
            style={{
              width: kecil ? 2 : 2,
              height: Math.max(2, Math.round(h * tinggiMaks)),
              background: warna,
              opacity: i < batangDimainkan ? 1 : 0.35,
            }}
          />
        ))}
      </span>
      <span style={{ fontFamily: 'var(--font-data)', fontSize: kecil ? 8 : 10, fontWeight: 700, color: warna, opacity: kecil ? 1 : 0.85, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {formatDurasi(durasi)}
      </span>
    </span>
  )
}
