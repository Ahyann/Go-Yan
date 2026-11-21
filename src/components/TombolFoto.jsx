import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { kompresFoto, kompresVideo } from '../lib/kompresFoto'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { playTombolKamera } from '../lib/sound'

// Tombol kamera/galeri: pilih foto, lihat pratinjau 4:3, lalu kirim.
// Kamera dibuka di dalam app lewat getUserMedia (HP maupun laptop), dengan
// bingkai 4:3 yang sama persis dengan hasil fotonya. Kalau kamera gak bisa
// dipakai (gak ada / izin ditolak), jatuh ke pilih file.
const layarSentuh = () => window.matchMedia('(pointer: coarse)').matches

function KameraLangsung({ onAmbil, onBatal, onGagal, gaya = false }) {
  const { t, lang } = useLanguage()
  const x = TEKS[lang] || TEKS.id
  const [kilat, setKilat] = useState(false)
  const [grid, setGrid] = useState(true)
  const [pos, setPos] = useState(null)

  // Gaya ojek: koordinat dan akurasi GPS ditampilkan di bawah bingkai selama kamera terbuka
  useEffect(() => {
    if (!gaya || !navigator.geolocation) return undefined
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [gaya])
  const videoRef = useRef(null)
  const [siap, setSiap] = useState(false)
  const [hadap, setHadap] = useState(layarSentuh() ? 'environment' : 'user')

  // Kamera depan HP ngasih gambar yang sudah mirror, dibalikin supaya hasilnya
  // normal (tulisan gak kebalik), baik di pratinjau maupun hasil foto.
  const balik = layarSentuh() && hadap === 'user'

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

  function jepret() {
    if (!siap || kilat) return
    const foto = kompresVideo(videoRef.current, balik)
    playTombolKamera()
    setKilat(true)
    setTimeout(() => onAmbil(foto), 380)
  }

  // Gaya akun ojek: layar penuh gelap, bingkai 4:3 dengan garis bagi dan siku cyan, shutter kotak bersudut potong
  if (gaya) {
    return (
      <LayarKonsol judul="CAMERA" onTutup={onBatal}>
        <div style={s.vf}>
          <video ref={videoRef} style={{ ...s.vfVideo, transform: balik ? 'scaleX(-1)' : undefined }} playsInline muted />
          {grid && <Garis />}
          <Siku />
          {kilat && (
            <>
              <div className="foto-kilat" style={s.kilat} />
              <div className="foto-klik" style={s.klik}>CLICK!</div>
            </>
          )}
        </div>
        <PetaMini pos={pos} x={x} />
        <div style={{ flex: 1 }} />
        <div style={s.kontrol}>
          <button type="button" className="tekan" style={{ ...s.kotakIkon, ...s.kotakGrid, ...(grid ? null : s.kotakMati) }} onClick={() => setGrid((g) => !g)} aria-pressed={grid} aria-label="Grid"><IkonGrid /><span>GRID</span></button>
          <button type="button" data-tanpa-suara className="tekan" style={{ ...s.shutter, opacity: siap ? 1 : 0.5, transform: kilat ? 'scale(0.92)' : undefined }} disabled={!siap} onClick={jepret} aria-label={t.ambilFoto}>
            <span style={{ ...s.shutterIsi, background: kilat ? '#7F1820' : '#BC1E2F' }} />
          </button>
          {layarSentuh() ? (
            <button type="button" className="tekan" style={s.kotakIkon} onClick={() => setHadap((h) => (h === 'environment' ? 'user' : 'environment'))} aria-label={t.balikKamera}><IkonBalik /></button>
          ) : (
            <span style={{ width: 44 }} />
          )}
        </div>
      </LayarKonsol>
    )
  }

  return createPortal(
    <div style={s.overlay} onClick={onBatal}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <video ref={videoRef} style={{ ...s.gambar, background: '#000', transform: balik ? 'scaleX(-1)' : undefined }} playsInline muted />
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
            onClick={() => onAmbil(kompresVideo(videoRef.current, balik))}
          >
            {t.ambilFoto}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

const TEKS = {
  id: { petunjuk: 'ARAHKAN KE TUJUAN · KETUK UNTUK FOTO', periksa: 'PERIKSA FOTONYA SEBELUM DIKIRIM', ulangi: 'ULANGI', kirim: 'KIRIM', kirimFajri: 'KIRIM KE FAJRI', lokasiFoto: 'LOKASI FOTO', mencari: 'MENCARI LOKASI…', akurasi: 'AKURASI' },
  en: { petunjuk: 'AIM AT THE SPOT · TAP TO SHOOT', periksa: 'CHECK THE PHOTO BEFORE SENDING', ulangi: 'RETAKE', kirim: 'SEND', kirimFajri: 'SEND TO FAJRI', lokasiFoto: 'PHOTO LOCATION', mencari: 'LOCATING…', akurasi: 'ACCURACY' },
}

const ik = (children, uk = 16) => (
  <svg width={uk} height={uk} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square" aria-hidden="true">{children}</svg>
)
const IkonX = () => ik(<path d="M5 5l14 14M19 5L5 19" />)
const IkonBalik = () => ik(<path d="M20 8a8 8 0 00-14-2M4 4v4h4M4 16a8 8 0 0014 2M20 20v-4h-4" />, 18)
const IkonGrid = () => ik(<><rect x="3" y="3" width="18" height="18" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></>, 16)
const IkonKirim = () => ik(<path d="M3 11l18-8-8 18-2-8z" />, 14)
const IkonUlang = () => ik(<><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-3" /></>, 14)

// Potongan peta kecil di bawah bingkai: titik lokasi, koordinat, dan akurasi GPS
function PetaMini({ pos, x }) {
  return (
    <div>
      <div style={{ ...s.petunjuk, textAlign: 'left', marginBottom: 6 }}>{x.lokasiFoto}</div>
      <div style={s.petaMini}>
        <span style={s.titikPeta} />
        <span style={s.koordinat}>{pos ? `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` : x.mencari}</span>
        {pos && <span style={s.akurasi}>{x.akurasi} {pos.acc} M</span>}
      </div>
    </div>
  )
}

// Garis bagi sepertiga dan siku cyan di bingkai kamera (akun ojek)
function Garis() {
  const g = { position: 'absolute', background: 'rgba(255,255,255,0.22)', pointerEvents: 'none' }
  return (
    <>
      <span style={{ ...g, left: '33.3%', top: 0, bottom: 0, width: 1 }} />
      <span style={{ ...g, left: '66.6%', top: 0, bottom: 0, width: 1 }} />
      <span style={{ ...g, left: 0, right: 0, top: '33.3%', height: 1 }} />
      <span style={{ ...g, left: 0, right: 0, top: '66.6%', height: 1 }} />
    </>
  )
}

function Siku() {
  const b = '3px solid #5ED0FF'
  const d = { position: 'absolute', width: 18, height: 18, pointerEvents: 'none' }
  return (
    <>
      <span style={{ ...d, left: 8, top: 8, borderTop: b, borderLeft: b }} />
      <span style={{ ...d, right: 8, top: 8, borderTop: b, borderRight: b }} />
      <span style={{ ...d, left: 8, bottom: 8, borderBottom: b, borderLeft: b }} />
      <span style={{ ...d, right: 8, bottom: 8, borderBottom: b, borderRight: b }} />
    </>
  )
}

// Layar penuh kamera dan pratinjau untuk akun ojek: latar gelap, tombol tutup, label cyan
function LayarKonsol({ judul, onTutup, children }) {
  return createPortal(
    <div style={s.layar}>
      <div style={s.layarIsi}>
        <div style={s.atas}>
          <button type="button" className="tekan" style={{ ...s.kotakIkon, width: 32, height: 32 }} onClick={onTutup} aria-label="Close"><IkonX /></button>
          <span style={s.labelCam}>{judul}</span>
          <span style={{ width: 32 }} />
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default function TombolFoto({ onKirimFoto, disabled, onSelesai, kecil = false }) {
  const { t, lang } = useLanguage()
  const { isDemo } = useAuth()
  const x = TEKS[lang] || TEKS.id
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
        style={{ ...s.tombol, ...(kecil ? { width: 24 } : null), opacity: disabled || sibuk ? 0.5 : 1 }}
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
          gaya={kecil}
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

      {pratinjau && kecil && (
        <LayarKonsol judul="PREVIEW" onTutup={() => setPratinjau(null)}>
          <div style={s.vf}>
            <img src={pratinjau} alt="" style={s.vfVideo} />
            <div style={s.tagUkuran}>4:3 · {Math.max(1, Math.round((pratinjau.length * 0.75) / 1024))} KB</div>
          </div>
          <div style={s.petunjuk}>{x.periksa}</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="tekan" style={s.tombolUlang} onClick={() => { setPratinjau(null); setKameraAktif(true) }}><IkonUlang />{x.ulangi}</button>
            <button type="button" data-tanpa-suara className="tekan" style={s.tombolKirim} onClick={handleKirim}><IkonKirim />{isDemo ? x.kirim : x.kirimFajri}</button>
          </div>
        </LayarKonsol>
      )}

      {pratinjau && !kecil && createPortal(
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
  layar: { position: 'fixed', inset: 0, background: '#04141F', zIndex: 1000000, display: 'flex', justifyContent: 'center' },
  layarIsi: { width: '100%', maxWidth: 430, boxSizing: 'border-box', padding: 'calc(var(--safe-top, 0px) + 16px) 16px calc(env(safe-area-inset-bottom, 0px) + 22px)', display: 'flex', flexDirection: 'column', gap: 12 },
  atas: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 32 },
  labelCam: { background: '#5ED0FF', color: '#04192A', fontFamily: "'Silkscreen', monospace", fontSize: 11, letterSpacing: '0.08em', padding: '4px 9px 3px', border: '2px solid #04192A' },
  kotakGrid: { flexDirection: 'column', gap: 2, fontFamily: "'Silkscreen', monospace", fontSize: 7, letterSpacing: '0.06em' },
  kotakMati: { opacity: 0.45 },
  petaMini: { position: 'relative', height: 62, overflow: 'hidden', background: '#132B45', backgroundImage: 'linear-gradient(#1C3A5A 2px, transparent 2px), linear-gradient(90deg, #1C3A5A 2px, transparent 2px)', backgroundSize: '26px 26px', border: '1px solid #5ED0FF55' },
  titikPeta: { position: 'absolute', left: '46%', top: '34%', width: 12, height: 12, background: '#ED1C24', border: '2px solid #04192A', boxShadow: '0 0 0 2px #5ED0FF' },
  koordinat: { position: 'absolute', left: 8, bottom: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#BFE9FF' },
  akurasi: { position: 'absolute', right: 8, bottom: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#4ADE80' },
  kotakIkon: { width: 44, height: 44, boxSizing: 'border-box', padding: 0, border: '1px solid #5ED0FF', background: 'rgba(4,25,42,0.7)', color: '#5ED0FF', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  vf: { position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#000', boxShadow: 'inset 0 0 0 2px #5ED0FF55' },
  vfVideo: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  petunjuk: { textAlign: 'center', fontFamily: "'Silkscreen', monospace", fontSize: 10, letterSpacing: '0.1em', color: '#8FB2D0' },
  kontrol: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px' },
  shutter: { width: 68, height: 68, boxSizing: 'border-box', padding: 0, border: '3px solid #5ED0FF', background: '#04192A', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)', transition: 'transform 0.08s' },
  shutterIsi: { width: 44, height: 44, boxShadow: 'inset 0 -4px 0 #7F1820, inset 0 0 0 2px #FF6B78' },
  kilat: { position: 'absolute', inset: 0, background: '#fff', pointerEvents: 'none' },
  klik: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-judul)', fontSize: 46, color: '#fff', letterSpacing: '2px', textShadow: '3px 3px 0 #BC1E2F', transform: 'rotate(-6deg)', pointerEvents: 'none' },
  tagUkuran: { position: 'absolute', left: 10, bottom: 10, background: 'rgba(4,25,42,0.85)', border: '1px solid #5ED0FF66', color: '#5ED0FF', fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.08em', padding: '4px 7px 3px' },
  tombolUlang: { flex: 1, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1px solid #5ED0FF', background: 'transparent', color: '#5ED0FF', borderRadius: 0, fontFamily: "'Silkscreen', monospace", fontSize: 11, letterSpacing: '0.08em' },
  tombolKirim: { flex: 1.3, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: 'none', background: '#BC1E2F', color: '#fff', borderRadius: 0, fontFamily: "'Silkscreen', monospace", fontSize: 11, letterSpacing: '0.08em', boxShadow: 'inset 0 -4px 0 #7F1820, inset 0 0 0 2px #FF6B78' },
  tombol: {
    flexShrink: 0,
    width: 36,
    borderRadius: 0,
    background: 'transparent',
    border: '1px solid var(--blue-border)',
    color: 'var(--glow-blue)',
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
    borderRadius: 0,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  gambar: {
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    borderRadius: 0,
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
    borderRadius: 0,
    border: '1px solid var(--blue-border)',
  },
  balik: {
    width: 46,
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text)',
    fontSize: 20,
    borderRadius: 0,
    border: '1px solid var(--blue-border)',
  },
  kirim: {
    flex: 1,
    background: 'var(--glow-blue-mid)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: 12,
    borderRadius: 0,
  },
}
