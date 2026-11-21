import { useEffect, useRef, useState } from 'react'
import { kompresFoto, kompresVideo } from '../lib/kompresFoto'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { playTombolKamera, playKonsolMati, playWhooshMasuk, playGantiSimpan } from '../lib/sound'
import { getar } from '../lib/getar'

// Sesi foto akun ojek: tombol kamera di konsol tidak membuka popup, tapi mengubah layar Home. Peta berganti jadi viewfinder
// (bingkai 4:3 sama persis dengan hasil foto) dan layar konsol bawah berganti jadi tombol potret bergaya layar piksel.
// Sesudah jepret ada pratinjau; saat dikirim fotonya mengecil terbang lalu layar memudar kembali ke peta.
const layarSentuh = () => window.matchMedia('(pointer: coarse)').matches

const TEKS = {
  id: { kamera: 'CAMERA', preview: 'PREVIEW', batal: 'BATAL', ulangi: 'ULANGI', kirim: 'KIRIM', kirimFajri: 'KIRIM KE FAJRI', terkirim: 'TERKIRIM', balik: 'Balik kamera', info: 'ARAHKAN KE TUJUAN' },
  en: { kamera: 'CAMERA', preview: 'PREVIEW', batal: 'CANCEL', ulangi: 'RETAKE', kirim: 'SEND', kirimFajri: 'SEND TO FAJRI', terkirim: 'SENT', balik: 'Switch camera', info: 'AIM AT THE SPOT' },
}

export function useSesiFoto({ aktif, onKirimFoto, suaraKeras = false }) {
  const { t } = useLanguage()
  const [fase, setFase] = useState(null) // null | kamera | preview | kirim
  const [hadap, setHadap] = useState(layarSentuh() ? 'environment' : 'user')
  const [siap, setSiap] = useState(false)
  const [kilat, setKilat] = useState(false)
  const [foto, setFoto] = useState(null)
  const videoRef = useRef(null)
  const inputRef = useRef(null)
  const timerRef = useRef([])

  // Kamera depan HP memberi gambar yang sudah mirror; dibalikkan supaya tulisan tidak terbalik
  const balik = layarSentuh() && hadap === 'user'

  useEffect(() => () => timerRef.current.forEach(clearTimeout), [])

  // Misi selesai atau dibatalkan saat sesi masih terbuka: tutup
  useEffect(() => {
    if (!aktif && fase) setFase(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif])

  useEffect(() => {
    if (fase !== 'kamera') return undefined
    let stream = null
    let batalFlag = false
    setSiap(false)
    const gagal = () => {
      // Kamera tidak ada atau izin ditolak: pilih foto dari berkas sebagai gantinya
      setFase(null)
      inputRef.current?.click()
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      gagal()
      return undefined
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: hadap }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => {
        if (batalFlag) {
          s.getTracks().forEach((tr) => tr.stop())
          return
        }
        stream = s
        if (!videoRef.current) return
        videoRef.current.srcObject = s
        videoRef.current.play().then(() => setSiap(true)).catch(gagal)
      })
      .catch(gagal)
    return () => {
      batalFlag = true
      stream?.getTracks().forEach((tr) => tr.stop())
    }
  }, [fase, hadap])

  function mulai() {
    setFoto(null)
    setFase('kamera')
  }

  // Batal: layar mati seperti TV tabung (menyusut jadi garis) dulu, baru sesi ditutup
  function batal() {
    if (fase === 'tutup') return
    playKonsolMati()
    getar(10)
    setFase('tutup')
    timerRef.current.push(setTimeout(() => {
      setFase(null)
      setFoto(null)
    }, 420))
  }

  function jepret() {
    if (!siap || kilat || !videoRef.current) return
    const hasil = kompresVideo(videoRef.current, balik)
    playTombolKamera(suaraKeras)
    getar(15)
    setFoto(hasil)
    setKilat(true)
    timerRef.current.push(setTimeout(() => {
      setKilat(false)
      setFase('preview')
    }, 380))
  }

  function ulangi() {
    setFoto(null)
    setFase('kamera')
  }

  function kirim() {
    const f = foto
    if (!f || fase !== 'preview') return
    setFase('kirim')
    playWhooshMasuk()
    getar(20)
    Promise.resolve(onKirimFoto(f)).catch((err) => {
      console.error('Gagal kirim foto:', err)
      alert(t.fotoGagal)
    })
    timerRef.current.push(setTimeout(() => playGantiSimpan(), 500))
    timerRef.current.push(setTimeout(() => {
      setFase(null)
      setFoto(null)
    }, 1150))
  }

  async function handlePilih(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setFoto(await kompresFoto(file))
      setFase('preview')
    } catch (err) {
      console.error('Gagal proses foto:', err)
      alert(t.fotoGagal)
    }
  }

  return { fase, siap, kilat, foto, hadap, setHadap, videoRef, inputRef, balik, mulai, batal, jepret, ulangi, kirim, handlePilih }
}

export function FotoInput({ sesi }) {
  return <input ref={sesi.inputRef} type="file" accept="image/*" hidden onChange={sesi.handlePilih} />
}

const ik = (children, uk = 14) => (
  <svg width={uk} height={uk} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square" aria-hidden="true">{children}</svg>
)
const IkonBalik = () => ik(<path d="M20 8a8 8 0 00-14-2M4 4v4h4M4 16a8 8 0 0014 2M20 20v-4h-4" />, 16)
const IkonX = () => ik(<path d="M5 5l14 14M19 5L5 19" />, 12)
const IkonKirim = () => ik(<path d="M3 11l18-8-8 18-2-8z" />, 12)
const IkonUlang = () => ik(<><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-3" /></>, 12)

function Garis() {
  const g = { position: 'absolute', background: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }
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
  const d = { position: 'absolute', width: 16, height: 16, pointerEvents: 'none' }
  return (
    <>
      <span style={{ ...d, left: 6, top: 6, borderTop: b, borderLeft: b }} />
      <span style={{ ...d, right: 6, top: 6, borderTop: b, borderRight: b }} />
      <span style={{ ...d, left: 6, bottom: 6, borderBottom: b, borderLeft: b }} />
      <span style={{ ...d, right: 6, bottom: 6, borderBottom: b, borderRight: b }} />
    </>
  )
}

// Menggantikan peta di area peta Home selama sesi foto
// mandiri: dipakai akun penumpang (tanpa konsol): lapisan kaca menutup seluruh Home, tombol potret ada di lapisan itu sendiri
export function FotoPeta({ sesi, mandiri = false }) {
  const { lang } = useLanguage()
  const x = TEKS[lang] || TEKS.id
  const { fase, foto, kilat, videoRef, balik } = sesi
  if (!fase) return null
  const kirim = fase === 'kirim'
  // mandiri (penumpang): lapisan kaca di bawah kartu status (z 900) supaya kartu tetap terlihat dan baris tombolnya berganti jadi tombol potret
  const zl = mandiri ? 899 : 1150
  return (
    <>
      <div className={fase === 'kamera' ? 'tv-nyala' : kirim ? 'foto-lapis-hilang' : fase === 'tutup' ? 'tv-mati' : undefined} style={{ ...s.lapis, zIndex: zl, ...(mandiri ? { padding: '0 14px 150px', gap: 12, background: 'rgba(1, 42, 64, 0.86)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : null) }}>
        {mandiri && !kirim && fase !== 'tutup' && <span style={s.labelCam}>{fase === 'kamera' ? x.kamera : x.preview}</span>}
        <div style={s.bingkai}>
          {fase === 'kamera' && <video ref={videoRef} style={{ ...s.vfIsi, transform: balik ? 'scaleX(-1)' : undefined }} playsInline muted />}
          {fase !== 'kamera' && foto && <img src={foto} alt="" className={kirim ? 'foto-terbang' : undefined} style={s.vfIsi} />}
          {fase === 'kamera' && <Garis />}
          {!kirim && <Siku />}
          {kilat && (
            <>
              <div className="foto-kilat" style={s.kilat} />
              <div className="foto-klik" style={s.klik}>CLICK!</div>
            </>
          )}
          {fase === 'preview' && foto && <div style={s.tag}>4:3 · {Math.max(1, Math.round((foto.length * 0.75) / 1024))} KB</div>}
        </div>
        {!kirim && fase !== 'tutup' && <div style={s.info}>{fase === 'kamera' ? x.info : x.preview}</div>}
      </div>
      {kirim && (
        <>
          <span className="foto-sonar" style={{ ...s.sonar, zIndex: zl + 1 }} />
          <div className="foto-terkirim" style={{ ...s.terkirim, zIndex: zl + 2 }}>✓ {x.terkirim}</div>
        </>
      )}
    </>
  )
}

// Mengganti isi layar konsol bawah selama sesi foto: tombol potret di tengah, batal di kiri, balik kamera di kanan
export function FotoKonsol({ sesi }) {
  const { lang } = useLanguage()
  const { isDemo } = useAuth()
  const x = TEKS[lang] || TEKS.id
  const { fase, siap, kilat } = sesi
  if (fase === 'kamera') {
    return (
      <div key="kamera" className="tv-nyala" style={s.barisKonsol}>
        <button type="button" data-tanpa-suara className="tekan" style={{ ...s.tombol, ...s.tombolBatal }} onClick={sesi.batal}><IkonX />{x.batal}</button>
        <button type="button" data-tanpa-suara className="tekan" style={{ ...s.potret, opacity: siap ? 1 : 0.5, transform: kilat ? 'scale(0.92)' : undefined }} disabled={!siap} onClick={sesi.jepret} aria-label="Shutter">
          <span style={{ ...s.potretIsi, background: kilat ? '#7F1820' : '#BC1E2F' }} />
        </button>
        {layarSentuh() ? (
          <button type="button" data-tanpa-suara className="tekan" style={s.tombol} onClick={() => sesi.setHadap((h) => (h === 'environment' ? 'user' : 'environment'))} aria-label={x.balik}><IkonBalik /></button>
        ) : (
          <span style={{ flex: 1 }} />
        )}
      </div>
    )
  }
  if (fase === 'tutup') {
    return <div key="tutup" className="tv-mati" style={s.barisKonsol} />
  }
  if (fase === 'preview') {
    return (
      <div key="preview" className="tv-nyala" style={s.barisKonsol}>
        <button type="button" data-tanpa-suara className="tekan" style={{ ...s.tombol, ...s.tombolBatal }} onClick={sesi.batal}><IkonX /></button>
        <button type="button" data-tanpa-suara className="tekan" style={s.tombol} onClick={sesi.ulangi}><IkonUlang />{x.ulangi}</button>
        <button type="button" data-tanpa-suara className="tekan" style={s.tombolKirim} onClick={sesi.kirim}><IkonKirim />{isDemo ? x.kirim : x.kirimFajri}</button>
      </div>
    )
  }
  return (
    <div key="kirim" className="cek-teks" style={{ ...s.barisKonsol, justifyContent: 'center', color: '#4ADE80', fontSize: 12 }}>
      ✓ {x.terkirim}
    </div>
  )
}

export const labelSesiFoto = (fase, lang) => (TEKS[lang] || TEKS.id)[fase === 'kamera' || fase === 'tutup' ? 'kamera' : 'preview']

const s = {
  labelCam: { alignSelf: 'center', background: '#5ED0FF', color: '#04192A', fontFamily: "'Silkscreen', monospace", fontSize: 11, letterSpacing: '0.08em', padding: '4px 9px 3px', border: '2px solid #04192A' },
  kontrolMandiri: { position: 'absolute', left: 14, right: 14, bottom: 'calc(var(--safe-bottom, 0px) + 96px)', fontFamily: "'Silkscreen', monospace" },
  lapis: { position: 'absolute', inset: 0, zIndex: 1150, background: 'rgba(1, 42, 64, 0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 8px', boxSizing: 'border-box', transformOrigin: 'center' },
  bingkai: { position: 'relative', width: '100%', aspectRatio: '4 / 3', maxHeight: '88%', background: '#000', overflow: 'hidden', boxShadow: '0 0 0 2px #5ED0FF55' },
  vfIsi: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  info: { fontFamily: "'Silkscreen', monospace", fontSize: 9, letterSpacing: '0.1em', color: '#8FB2D0' },
  kilat: { position: 'absolute', inset: 0, background: '#fff', pointerEvents: 'none' },
  klik: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-judul)', fontSize: 40, color: '#fff', letterSpacing: '2px', textShadow: '3px 3px 0 #BC1E2F', transform: 'rotate(-6deg)', pointerEvents: 'none' },
  tag: { position: 'absolute', left: 8, bottom: 8, background: 'rgba(4,25,42,0.85)', border: '1px solid #5ED0FF66', color: '#5ED0FF', fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.08em', padding: '3px 6px 2px' },
  sonar: { position: 'absolute', left: '50%', top: '50%', width: 44, height: 44, marginLeft: -22, marginTop: -22, border: '3px solid #4ADE80', borderRadius: '50%', zIndex: 1151, pointerEvents: 'none' },
  terkirim: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 1152, background: '#4ADE80', color: '#04192A', fontFamily: "'Silkscreen', monospace", fontSize: 12, letterSpacing: '0.1em', padding: '8px 14px 6px', boxShadow: '0 0 0 2px #04192A, 0 0 16px rgba(74,222,128,0.7)', pointerEvents: 'none', whiteSpace: 'nowrap' },
  barisKonsol: { display: 'flex', alignItems: 'center', gap: 8, height: 56, marginTop: -2 },
  tombol: { flex: 1, minWidth: 0, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0 6px', fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.06em', color: '#5ED0FF', background: 'transparent', border: '1px solid #5ED0FF', borderRadius: 0, whiteSpace: 'nowrap' },
  tombolBatal: { color: '#FF8A94', borderColor: '#FF6B78' },
  tombolKirim: { flex: 1.6, minWidth: 0, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0 6px', fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.06em', color: '#fff', background: '#BC1E2F', border: 'none', borderRadius: 0, whiteSpace: 'nowrap', boxShadow: 'inset 0 -3px 0 #7F1820, inset 0 0 0 2px #FF6B78' },
  potret: { flexShrink: 0, width: 54, height: 54, boxSizing: 'border-box', padding: 0, border: '3px solid #5ED0FF', background: '#04192A', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)', transition: 'transform 0.08s' },
  potretIsi: { width: 34, height: 34, boxShadow: 'inset 0 -3px 0 #7F1820, inset 0 0 0 2px #FF6B78' },
}
