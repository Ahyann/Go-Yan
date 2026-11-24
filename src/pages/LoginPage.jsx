import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import PilihBahasa from '../components/PilihBahasa.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { playGoBuka, playPesananBatal } from '../lib/sound'
import { getar, POLA_GETAR } from '../lib/getar'
import SpideyMenunggu from '../components/SpideyMenunggu.jsx'
import LogoLabaSentuh from '../components/LogoLabaSentuh.jsx'
import { mulaiTransisiDemo, selesaiTransisiDemo } from '../lib/transisiDemo'

// Blokir login setelah salah password berkali-kali. Disimpan di localStorage supaya refresh halaman tidak membuka blokir.
// Setelah blokir pertama (3 kali salah), SETIAP salah lagi langsung memblokir dengan waktu yang makin lama.
// Lama blokir: 30 detik, 5 menit, 10 menit, lalu bertambah 10 menit tiap kali (maksimal 1 jam).
// Berhasil login menghapus semua hitungan ini, jadi setelah logout dan salah 3 kali lagi, mulai lagi dari 30 detik.
const BATAS_GAGAL = 3
const durasiBlok = (ke) => (ke === 0 ? 30_000 : ke === 1 ? 300_000 : Math.min(600_000 * (ke - 1), 3_600_000))
const KUNCI_BLOK = 'goyan:loginBlok'
const KODE_SALAH = ['auth/invalid-credential', 'auth/invalid-email', 'auth/wrong-password', 'auth/user-not-found']

function bacaBlok() {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI_BLOK) || '{}')
    return { gagal: d.gagal || 0, ke: d.ke || 0, sampai: d.sampai || 0 }
  } catch {
    return { gagal: 0, ke: 0, sampai: 0 }
  }
}
function simpanBlok(d) {
  try { localStorage.setItem(KUNCI_BLOK, JSON.stringify(d)) } catch { /* penyimpanan diblokir */ }
}

function usernameKeEmail(input) {
  const bersih = input.trim().toLowerCase().replace(/\s+/g, '')
  if (bersih.includes('@')) return bersih
  return `${bersih}@gmail.com`
}

// Tulisan sambutan: diketik, ditahan, dihapus, lalu diketik lagi, dengan waktu yang sama seperti keterangan di konsol
// penumpang (KeteranganKetik), tapi mengetik dan menghapus lebih cepat. Punya state sendiri supaya halaman login tidak digambar ulang tiap 50 ms.
const KETIK_MS = 65
const HAPUS_MS = 40
const TAHAN_MS = 10000
const JEDA_MS = 500
function SambutanKetik({ teks, mulaiMs }) {
  const [mulai] = useState(() => Date.now() + mulaiMs)
  const [sekarang, setSekarang] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setSekarang(Date.now()), 50)
    return () => clearInterval(id)
  }, [])
  const lama = teks.length * (KETIK_MS + HAPUS_MS) + TAHAN_MS + JEDA_MS
  const t = sekarang - mulai
  let huruf = 0
  if (t > 0) {
    const sisa = t % lama
    const tKetik = teks.length * KETIK_MS
    if (sisa < tKetik) huruf = Math.floor(sisa / KETIK_MS)
    else if (sisa < tKetik + TAHAN_MS) huruf = teks.length
    else huruf = Math.max(0, teks.length - Math.floor((sisa - tKetik - TAHAN_MS) / HAPUS_MS))
  }
  return (
    <>
      <span style={s.sambutanTanda} aria-hidden="true">&gt; </span>
      {teks.slice(0, huruf)}
      <span className="login-kursor" style={{ color: 'var(--glow-blue)' }} aria-hidden="true">_</span>
    </>
  )
}

// Ikon piksel 7x7 di kotak kiri kolom Username dan Password
const IKON_ORANG = ['..###..', '..###..', '..###..', '.......', '.#####.', '#######', '#######']
const IKON_GEMBOK = ['..###..', '.#...#.', '.#...#.', '#######', '###.###', '###.###', '#######']
function IkonPiksel({ pola }) {
  return (
    <svg width="14" height="14" viewBox="0 0 7 7" shapeRendering="crispEdges" fill="var(--glow-blue)" aria-hidden="true">
      {pola.flatMap((baris, y) => [...baris].map((sel, x) => (sel === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)))}
    </svg>
  )
}

export default function LoginPage() {
  const { t } = useLanguage()
  const { masukDemoOjek, masukDemoPenumpang } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tampilkanPw, setTampilkanPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState('')
  const [blok, setBlok] = useState(bacaBlok)
  const [sekarang, setSekarang] = useState(() => Date.now())
  const terblokir = blok.sampai > sekarang

  // Selama terblokir, cek berkala; begitu waktunya habis layar blokir ditutup dan hitungan gagal mulai dari nol.
  useEffect(() => {
    if (!blok.sampai) return undefined
    const id = setInterval(() => {
      const kini = Date.now()
      setSekarang(kini)
      if (kini >= blok.sampai) {
        // gagal dibiarkan satu langkah di bawah batas: satu salah lagi langsung memblokir lagi, dengan waktu lebih lama
        const baru = { ...blok, gagal: BATAS_GAGAL - 1, sampai: 0 }
        simpanBlok(baru)
        setBlok(baru)
      }
    }, 250)
    return () => clearInterval(id)
  }, [blok])

  function catatGagal() {
    const gagal = blok.gagal + 1
    if (gagal < BATAS_GAGAL) {
      const baru = { ...blok, gagal }
      simpanBlok(baru)
      setBlok(baru)
      return
    }
    const durasi = durasiBlok(blok.ke)
    const baru = { gagal, ke: blok.ke + 1, sampai: Date.now() + durasi }
    simpanBlok(baru)
    setBlok(baru)
    setSekarang(Date.now())
    playPesananBatal()
    getar(POLA_GETAR.kaget)
  }

  const PESAN_ERROR = {
    'auth/invalid-email': t.errInvalidCredential,
    'auth/invalid-credential': t.errInvalidCredential,
    'auth/too-many-requests': t.errTooManyRequests,
    'auth/network-request-failed': t.errNetworkFailed,
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (terblokir || transisi) return
    getar(12)
    playGoBuka()
    setError('')
    setLoading(true)
    // Animasi masuk baru dimulai setelah login terbukti benar. Selama menunggu (atau kalau salah) tidak ada animasi apa pun,
    // hanya tombol yang menunjukkan loading dan pesan error kalau gagal.
    try {
      await signInWithEmailAndPassword(auth, usernameKeEmail(username), password)
      simpanBlok({ gagal: 0, ke: 0, sampai: 0 }) // berhasil masuk: hitungan salah dan tingkat blokir dimulai dari awal
      mulaiTransisiDemo('masuk', 900)
    } catch (err) {
      setError(PESAN_ERROR[err.code] || t.errGeneric)
      setLoading(false)
      if (KODE_SALAH.includes(err.code)) catatGagal()
    }
  }

  const [pemicuLogo, setPemicuLogo] = useState(0)
  // Alur masuk demo: 'terbang' (isi halaman menghilang, logo meluncur ke tengah dan membesar), lalu 'welcome'
  // (layar penuh bergaya layar menunggu ojek), baru setelah itu benar-benar login ke akun demo.
  const [transisi, setTransisi] = useState(null)
  function pilihDemo(peran, jalankan) {
    if (demoLoading || transisi) return
    getar(8)
    setDemoLoading(peran)
    setPemicuLogo((n) => n + 1)
    // 0,15 dtk: isi halaman menghilang dan logo terbang ke tengah (0,7 dtk, memantul seperti pegas). 0,9 dtk: layar welcome (TransisiDemo, di
    // tingkat App) mengambil alih dengan logo di posisi yang sama, dan login demo dimulai di baliknya. Begitu app demo
    // siap, layar welcome berubah dari buram ke bening memperlihatkan app.
    setTimeout(() => setTransisi({ peran, tahap: 'terbang' }), 150)
    setTimeout(() => {
      mulaiTransisiDemo(peran)
      handleDemo(peran, jalankan)
    }, 900)
  }

  async function handleDemo(peran, jalankan) {
    setError('')
    setDemoLoading(peran)
    try {
      await jalankan()
    } catch {
      setError(t.errGeneric)
      setDemoLoading('')
      setTransisi(null)
      selesaiTransisiDemo()
    }
  }

  const barDemo = (
  <div className="login-demo-bar">
    <button
      type="button"
      className="login-demo-btn"
      style={{ ...s.demoBtn, ...s.demoSisiOjek, ...(demoLoading === 'ojek' ? s.demoPilihOjek : null) }}
      onClick={() => pilihDemo('ojek', masukDemoOjek)}
      disabled={Boolean(demoLoading)}
    >
      <span style={s.demoTeks}>{t.demoSisiOjek}</span>
    </button>
    <button
      type="button"
      className="login-demo-btn"
      style={{ ...s.demoBtn, ...(demoLoading === 'penumpang' ? s.demoPilihPenumpang : null) }}
      onClick={() => pilihDemo('penumpang', masukDemoPenumpang)}
      disabled={Boolean(demoLoading)}
    >
      <span style={s.demoTeks}>{t.demoSisiPenumpang}</span>
    </button>
  </div>
  )

  return (
    <>
    {/* Latar CRT sengaja di luar <main>: selama animasi TV menyala <main> punya transform, dan elemen fixed di dalamnya
        jadi terkurung seukuran <main>, sehingga bagian bawah layar HP tampak kosong. */}
    <div className="login-latar-crt" aria-hidden="true" />
    <main className={`login-tv${transisi ? ' login-keluar' : ''}`} style={s.wrap}>
      <div className="login-garis-layar" aria-hidden="true" />
      <PilihBahasa style={s.bahasa} />

      <div style={s.brand}>
        <div style={s.logo} aria-label="GO-YAN">
          <span className="login-kedip">GO-YAN</span>
        </div>
        <div className="login-garis" style={{ '--d': '1000ms', marginBottom: 10 }} aria-hidden="true" />
        <div style={s.sambutan} aria-live="off">
          <SambutanKetik teks={t.demoSelamatDatangJudul} mulaiMs={1150} />
        </div>
        <h1 className="login-naik" style={{ ...s.title, '--d': '1250ms' }}>{t.loginTitle}</h1>
      </div>

      <form style={s.form} onSubmit={handleSubmit}>
        <label className="login-naik" style={{ ...s.label, '--d': '1400ms' }}>
          <span style={s.labelTeks}>{t.loginUsername}</span>
          <span className="login-kolom" style={s.kolom}>
            <span className="login-kolom-ikon" style={s.kolomIkon}>
              <IkonPiksel pola={IKON_ORANG} />
            </span>
            <input
              className="login-input"
              style={s.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </span>
        </label>

        <label className="login-naik" style={{ ...s.label, '--d': '1500ms' }}>
          <span style={s.labelTeks}>{t.loginPassword}</span>
          <span className="login-kolom" style={s.kolom}>
            <span className="login-kolom-ikon" style={s.kolomIkon}>
              <IkonPiksel pola={IKON_GEMBOK} />
            </span>
            <input
              className="login-input"
              style={s.input}
              type={tampilkanPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              style={s.pwToggle}
              onClick={() => setTampilkanPw((v) => !v)}
              aria-label={tampilkanPw ? t.sembunyikanPw : t.tampilkanPw}
            >
              {tampilkanPw ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </span>
        </label>

        {error && <div style={s.error}>{error}</div>}

        <button className="login-naik login-masuk-btn tekan" style={{ ...s.submit, '--d': '1600ms' }} type="submit" disabled={loading}>
          <span>{loading ? t.loginMemproses : t.loginSubmit}</span>
          {/* tiga panah yang menyala bergantian ke kanan */}
          <span className="login-panah" aria-hidden="true"><i>▸</i><i>▸</i><i>▸</i></span>
        </button>
      </form>

      <div className="login-naik" style={{ ...s.demoWrap, '--d': '1750ms' }}>
        <div style={s.demoDivider}>
          <span style={s.demoDividerGaris} />
          <span style={s.demoDividerTeks}>{t.demoAtau}</span>
          <span style={s.demoDividerGaris} />
        </div>
      </div>

      {/* logo laba-laba besar mengisi ruang kosong; dipencet memancarkan gelombang cahaya. Saklar demo di bawahnya. */}
      <div className="login-naik login-logo-wadah" style={{ ...s.logoBawah, '--d': '1900ms' }}>
        <LogoLabaSentuh pemicu={pemicuLogo} terbang={Boolean(transisi)} />
      </div>
      <div className="login-naik" style={{ ...s.saklarDemo, '--d': '2000ms' }}>
        {barDemo}
      </div>
    </main>
    {terblokir && (
      <div style={s.blokLayar}>
        {/* demo tidak butuh password, jadi tetap bisa dipakai selama login dikunci */}
        <div style={s.blokDemo} className="login-demo-kecil">{barDemo}</div>
        <div style={s.blokOverlay}>
          <SpideyMenunggu
            key={blok.sampai}
            dibuatPada={blok.sampai}
            sampai={blok.sampai}
            teks={{ menunggu: t.blokJudul, menungguSub: t.blokSub }}
            modeMerah
            pesanSentuh={t.blokPesan}
            bawahTeks="calc(var(--safe-bottom) + 66px)"
          />
        </div>
      </div>
    )}
    </>
  )
}

const s = {
  logoBawah: { flex: '1 1 auto', minHeight: 0, display: 'flex', marginTop: 12 },
  // layar blokir menutup seluruh layar di atas halaman login; dua lapis karena SpideyMenunggu mengukur ukurannya dari dua induk
  // tanpa warna latar: kartu Spidey sendiri setengah transparan, jadi halaman login terlihat samar di belakangnya (efek kaca seperti kartu menunggu ojek di atas peta)
  blokLayar: { position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', WebkitBackdropFilter: 'blur(5px)', backdropFilter: 'blur(5px)' },
  // kartu SpideyMenunggu melebar 14px ke kiri dan kanan dari induknya (dibuat untuk peta), jadi induknya disempitkan 14px
  // supaya kartu pas selebar layar dan logo laba-laba di latar tepat di tengah
  blokDemo: { position: 'absolute', left: 24, right: 24, bottom: 'calc(var(--safe-bottom) + 14px)', zIndex: 2 },
  blokOverlay: { position: 'absolute', top: 0, bottom: 0, left: 14, right: 14 },
  wrap: {
    position: 'relative',
    zIndex: 1, // di atas latar CRT
    minHeight: 'var(--app-height, 100dvh)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 'calc(var(--safe-top) + 52px) 24px calc(var(--safe-bottom) + 12px)',
    maxWidth: 400,
    margin: '0 auto',
  },
  // Pilihan bahasa kecil di pojok kanan atas.
  bahasa: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 14px)',
    right: 24,
  },
  brand: { marginBottom: 24 },
  logo: {
    fontFamily: 'var(--font-judul)',
    fontSize: 64,
    lineHeight: 1,
    letterSpacing: '3px',
    color: 'var(--glow-blue)',
    textShadow: '0 0 14px var(--glow-blue-mid), 3px 3px 0 var(--nav-red)',
    marginBottom: 8,
  },
  sambutan: {
    minHeight: 18,
    fontFamily: 'var(--font-data)',
    fontSize: 12,
    letterSpacing: '0.12em',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  sambutanTanda: { color: 'var(--web-red)', fontWeight: 700 },
  eyebrow: { fontSize: 11, letterSpacing: '0.16em', color: 'var(--glow-blue)', marginBottom: 6, fontWeight: 700, textShadow: '0 0 6px var(--glow-blue-mid)' },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 34,
    color: 'var(--text)',
    letterSpacing: '1px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6 },
  labelTeks: { fontFamily: 'var(--font-data)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9FC3E8' },
  // kotak kolom: ikon piksel di kiri (dengan garis pemisah), lalu isian; menyala cyan saat aktif (lihat .login-kolom)
  kolom: { display: 'flex', alignItems: 'stretch', background: 'var(--card-blue)', border: '1px solid var(--blue-border)' },
  kolomIkon: {
    width: 44,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid var(--blue-border)',
    background: 'rgba(94, 208, 255, 0.08)',
  },
  input: {
    flex: 1,
    minWidth: 0,
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    padding: '13px 12px',
    fontSize: 15,
    color: 'var(--text)',
  },
  pwToggle: {
    width: 44,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    color: '#8FB4DC',
    borderRadius: 0,
  },
  error: {
    fontSize: 13,
    color: 'var(--web-red)',
    background: 'var(--card-blue)',
    border: '1px solid var(--web-red)',
    borderRadius: 0,
    padding: '10px 14px',
  },
  submit: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--web-red)',
    color: '#fff',
    fontFamily: 'var(--font-data)',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    padding: '14px 16px',
    borderRadius: 0,
    marginTop: 6,
  },
  saklarDemo: { marginTop: 8 },
  demoPilihOjek: { background: 'rgba(188, 30, 47, 0.55)', color: '#FFFFFF', opacity: 1 },
  demoPilihPenumpang: { background: 'rgba(27, 111, 184, 0.6)', color: '#FFFFFF', opacity: 1 },
  demoWrap: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  demoDivider: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  demoDividerGaris: {
    flex: 1,
    height: 1,
    background: 'rgba(94, 208, 255, 0.45)',
  },
  demoDividerTeks: {
    fontSize: 10.5,
    color: '#FFFFFF',
    letterSpacing: '0.1em',
    whiteSpace: 'nowrap',
  },
  demoBtn: {
    flex: 1,
    minWidth: 0, // biar tombol gak melebar gara-gara teks panjang
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'transparent',
    color: 'var(--glow-blue)',
    padding: '13px 6px',
    borderRadius: 0,
    border: 'none',
  },
  demoTeks: {
    maxWidth: '100%',
    whiteSpace: 'nowrap', // satu baris, tinggi tombol sama di semua bahasa
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'var(--font-data)',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.12em',
  },
  // sisi ojek bernuansa merah sejak awal (seperti mockup), sisi penumpang biru tua
  demoSisiOjek: { background: 'rgba(188, 30, 47, 0.45)', color: '#FFFFFF' },
}