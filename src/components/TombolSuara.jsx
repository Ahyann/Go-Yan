import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { formatDurasi } from './PemutarSuara.jsx'

const BATAS_DETIK = 20
const BATAS_UKURAN = 450000 // karakter data URL; di atas ini terlalu besar untuk database

function pilihFormat() {
  const kandidat = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus']
  return kandidat.find((f) => window.MediaRecorder?.isTypeSupported?.(f)) || ''
}

function bacaDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const pembaca = new FileReader()
    pembaca.onload = () => resolve(pembaca.result)
    pembaca.onerror = reject
    pembaca.readAsDataURL(blob)
  })
}

// Tombol mikrofon di samping kamera. Ditekan: mulai merekam, dan bar perekam menutupi baris input
// (batal, penghitung waktu, kirim). Maksimal 20 detik, lalu otomatis berhenti dan terkirim.
// Baris induk harus position: relative supaya bar perekam bisa menutupinya.
// kecil: versi 24px untuk konsol ojek; bar rekaman hanya menampilkan titik merah dan durasi.
export default function TombolSuara({ onKirimSuara, disabled, kecil = false }) {
  const { t } = useLanguage()
  const [merekam, setMerekam] = useState(false)
  const [detik, setDetik] = useState(0)
  const perekamRef = useRef(null)
  const aliranRef = useRef(null)
  const potonganRef = useRef([])
  const timerRef = useRef(null)
  const mulaiRef = useRef(0)
  const batalRef = useRef(false)

  const bersihkan = () => {
    clearInterval(timerRef.current)
    aliranRef.current?.getTracks().forEach((tr) => tr.stop())
    aliranRef.current = null
    perekamRef.current = null
  }

  useEffect(
    () => () => {
      batalRef.current = true
      if (perekamRef.current?.state === 'recording') perekamRef.current.stop()
      bersihkan()
    },
    []
  )

  async function mulai() {
    if (disabled || merekam) return
    try {
      const aliran = await navigator.mediaDevices.getUserMedia({ audio: true })
      aliranRef.current = aliran
      const format = pilihFormat()
      const perekam = new MediaRecorder(aliran, format ? { mimeType: format, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 })
      potonganRef.current = []
      batalRef.current = false
      perekam.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) potonganRef.current.push(e.data)
      }
      perekam.onstop = async () => {
        const lama = Math.round((Date.now() - mulaiRef.current) / 1000)
        const jenis = perekam.mimeType || format || 'audio/webm'
        const dibatalkan = batalRef.current
        bersihkan()
        setMerekam(false)
        setDetik(0)
        if (dibatalkan || lama < 1) return
        try {
          const dataUrl = await bacaDataUrl(new Blob(potonganRef.current, { type: jenis }))
          if (dataUrl.length > BATAS_UKURAN) throw new Error('rekaman terlalu besar')
          await onKirimSuara(dataUrl, lama)
        } catch (err) {
          console.error('Gagal mengirim pesan suara:', err)
          alert(t.suaraGagal)
        }
      }
      perekamRef.current = perekam
      mulaiRef.current = Date.now()
      perekam.start()
      setMerekam(true)
      setDetik(0)
      timerRef.current = setInterval(() => {
        const lama = Math.floor((Date.now() - mulaiRef.current) / 1000)
        setDetik(lama)
        if (lama >= BATAS_DETIK && perekamRef.current?.state === 'recording') perekamRef.current.stop()
      }, 250)
    } catch (err) {
      console.error('Tidak bisa merekam:', err)
      bersihkan()
      alert(t.suaraGagal)
    }
  }

  function kirim() {
    if (perekamRef.current?.state === 'recording') perekamRef.current.stop()
  }

  function batal() {
    batalRef.current = true
    if (perekamRef.current?.state === 'recording') perekamRef.current.stop()
    else {
      bersihkan()
      setMerekam(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="tekan"
        style={{ ...s.tombol, ...(kecil ? { width: 24 } : null), opacity: disabled ? 0.5 : 1 }}
        onClick={mulai}
        disabled={disabled}
        aria-label={t.ariaRekamSuara}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" />
          <path d="M5 11v1a7 7 0 0014 0v-1M12 19v3" />
        </svg>
      </button>
      {merekam && (
        <div style={{ ...s.bar, ...(kecil ? s.barKonsol : null) }} role="group" aria-label={t.suaraMerekam}>
          <button type="button" className="tekan" style={{ ...s.batal, ...(kecil ? s.batalKonsol : null) }} onClick={batal} aria-label={t.ariaBatalRekam}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div style={{ ...s.waktu, ...(kecil ? s.waktuKonsol : null) }}>
            <span className="rekam-kedip" style={s.titikRekam} />
            {!kecil && <span style={s.label}>{t.suaraMerekam}</span>}
            {kecil ? (
              // Layar konsol: detik berjalan / batas maksimal, dengan garis kemajuan merah di dasar
              <>
                <span style={s.angkaKonsol}>{detik}<span style={{ opacity: 0.55 }}>/{BATAS_DETIK}S</span></span>
                <span aria-hidden="true" style={{ ...s.kemajuanKonsol, width: `${Math.min(100, (detik / BATAS_DETIK) * 100)}%` }} />
              </>
            ) : (
              <span style={s.angka}>{formatDurasi(detik)} / {formatDurasi(BATAS_DETIK)}</span>
            )}
          </div>
          <button type="button" className="tekan" style={{ ...s.kirim, ...(kecil ? s.kirimKonsol : null) }} onClick={kirim} aria-label={t.ariaKirimSuara}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true">
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}

const s = {
  // Versi konsol ojek (kecil): mengikuti layar abu bertekstur, huruf piksel cyan, tombol bertepi seperti tombol konsol lain
  barKonsol: { background: '#2F2F2F', gap: 4 },
  batalKonsol: { width: 24, border: '2px solid #5C7F96', color: '#94DDF4' },
  waktuKonsol: { position: 'relative', padding: '0 6px', gap: 5, background: '#1E1E1E', border: 'none', boxShadow: 'inset 0 0 0 2px #5ED0FF', overflow: 'hidden' },
  angkaKonsol: { fontFamily: "'Silkscreen', monospace", fontSize: 10, color: '#94DDF4', textShadow: '0 0 6px rgba(148, 221, 244, 0.5)', whiteSpace: 'nowrap' },
  kemajuanKonsol: { position: 'absolute', left: 0, bottom: 0, height: 3, background: '#BC1E2F', transition: 'width 1s linear' },
  kirimKonsol: { width: 24, background: '#BC1E2F', boxShadow: 'inset 0 -3px 0 #7F1820, inset 0 0 0 2px #FF6B78' },
  tombol: {
    flexShrink: 0,
    width: 36,
    background: 'transparent',
    border: '1px solid var(--blue-border)',
    color: 'var(--glow-blue)',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  bar: { position: 'absolute', inset: 0, zIndex: 5, display: 'flex', gap: 6, background: 'var(--panel)' },
  batal: { width: 36, flexShrink: 0, border: '1px solid var(--blue-border)', background: 'transparent', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  waktu: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', background: 'var(--bg)', border: '1px solid var(--blue-border)' },
  titikRekam: { width: 8, height: 8, background: 'var(--nav-red)', flexShrink: 0 },
  label: { fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--merah-teks)' },
  angka: { marginLeft: 'auto', fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 700, color: 'var(--glow-blue)' },
  kirim: { width: 36, flexShrink: 0, border: 'none', background: 'var(--nav-red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
}
