import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { kompresFoto, kompresVideo } from '../lib/kompresFoto'
import { useLanguage } from '../context/LanguageContext.jsx'

// Tombol kamera/galeri: pilih foto, lihat pratinjau 4:3, lalu kirim.
// Kamera dibuka di dalam app lewat getUserMedia (HP maupun laptop), dengan
// bingkai 4:3 yang sama persis dengan hasil fotonya. Kalau kamera gak bisa
// dipakai (gak ada / izin ditolak), jatuh ke pilih file.
const layarSentuh = () => window.matchMedia('(pointer: coarse)').matches

function KameraLangsung({ onAmbil, onBatal, onGagal }) {
  const { t } = useLanguage()
  const videoRef = useRef(null)
  const [siap, setSiap] = useState(false)
  const [hadap, setHadap] = useState(layarSentuh() ? 'environment' : 'user')

  useEffect(() => {
    let stream = null
    let batal = false
    setSiap(false)
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: hadap }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => {
        if (batal) {
          s.getTracks().forEach((tr) => tr.stop())
          return
        }
        stream = s
        videoRef.current.srcObject = s
        videoRef.current.play().then(() => setSiap(true)).catch(onGagal)
      })
      .catch(onGagal)
    if (!navigator.mediaDevices?.getUserMedia) onGagal()
    return () => {
      batal = true
      stream?.getTracks().forEach((tr) => tr.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hadap])

  return createPortal(
    <div style={s.overlay} onClick={onBatal}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <video ref={videoRef} style={{ ...s.gambar, background: '#000' }} playsInline muted />
        <div style={s.baris}>
          <button type="button" style={s.batal} onClick={onBatal}>{t.batal}</button>
          {layarSentuh() && (
            <button
              type="button"
              style={s.balik}
              onClick={() => setHadap((h) => (h === 'environment' ? 'user' : 'environment'))}
              aria-label={t.balikKamera}
            >
              ⟲
            </button>
          )}
          <button
            type="button"
            style={{ ...s.kirim, opacity: siap ? 1 : 0.5 }}
            disabled={!siap}
            onClick={() => onAmbil(kompresVideo(videoRef.current))}
          >
            {t.ambilFoto}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function TombolFoto({ onKirimFoto, disabled, onSelesai }) {
  const { t } = useLanguage()
  const inputRef = useRef(null)
  const [pratinjau, setPratinjau] = useState(null)
  const [sibuk, setSibuk] = useState(false)
  const [kameraAktif, setKameraAktif] = useState(false)

  async function handlePilih(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSibuk(true)
    try {
      setPratinjau(await kompresFoto(file))
    } catch (err) {
      console.error('Gagal proses foto:', err)
      alert(t.fotoGagal)
    } finally {
      setSibuk(false)
    }
  }

  async function handleKirim() {
    const foto = pratinjau
    setPratinjau(null)
    try {
      await onKirimFoto(foto)
      onSelesai?.()
    } catch (err) {
      console.error('Gagal kirim foto:', err)
      alert(t.fotoGagal)
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handlePilih} />
      <button
        type="button"
        style={{ ...s.tombol, opacity: disabled || sibuk ? 0.5 : 1 }}
        onClick={() => setKameraAktif(true)}
        disabled={disabled || sibuk}
        aria-label={t.ariaKirimFoto}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      {kameraAktif && (
        <KameraLangsung
          onBatal={() => setKameraAktif(false)}
          onAmbil={(foto) => {
            setKameraAktif(false)
            setPratinjau(foto)
          }}
          onGagal={() => {
            // Kamera gak ada / izin ditolak: balik ke pilih file.
            setKameraAktif(false)
            inputRef.current?.click()
          }}
        />
      )}

      {pratinjau && createPortal(
        <div style={s.overlay} onClick={() => setPratinjau(null)}>
          <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
            <img src={pratinjau} alt="" style={s.gambar} />
            <div style={s.baris}>
              <button type="button" style={s.batal} onClick={() => setPratinjau(null)}>{t.batal}</button>
              <button type="button" style={s.kirim} onClick={handleKirim}>{t.kirim}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

const s = {
  tombol: {
    flexShrink: 0,
    width: 42,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000000,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 16,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  gambar: {
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    borderRadius: 10,
    display: 'block',
  },
  baris: { display: 'flex', gap: 10 },
  batal: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    fontSize: 15,
    fontWeight: 600,
    padding: 12,
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
  balik: {
    width: 46,
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text)',
    fontSize: 20,
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
  kirim: {
    flex: 1,
    background: 'var(--glow-blue-mid)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: 12,
    borderRadius: 999,
  },
}
