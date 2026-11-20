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
        <div style={s.bar} role="group" aria-label={t.suaraMerekam}>
          <button type="button" className="tekan" style={{ ...s.batal, ...(kecil ? { width: 24 } : null) }} onClick={batal} aria-label={t.ariaBatalRekam}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div style={{ ...s.waktu, ...(kecil ? { padding: '0 6px', gap: 5 } : null) }}>
            <span className="rekam-kedip" style={s.titikRekam} />
            {!kecil && <span style={s.label}>{t.suaraMerekam}</span>}
            <span style={s.angka}>{kecil ? formatDurasi(detik) : `${formatDurasi(detik)} / ${formatDurasi(BATAS_DETIK)}`}</span>
          </div>
          <button type="button" className="tekan" style={{ ...s.kirim, ...(kecil ? { width: 24 } : null) }} onClick={kirim} aria-label={t.ariaKirimSuara}>
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
