import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import PilihBahasa from '../components/PilihBahasa.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { bunyikanSetelahSiap, playSambutKonsol, playGoBuka, playPesananBatal } from '../lib/sound'
import { getar, POLA_GETAR } from '../lib/getar'
import SpideyMenunggu from '../components/SpideyMenunggu.jsx'
import LogoLabaSentuh from '../components/LogoLabaSentuh.jsx'

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

// Teks sambutan diketik huruf demi huruf setelah judul selesai jatuh.
function useKetik(teks, mulaiMs = 750, jedaMs = 38) {
  const [jumlah, setJumlah] = useState(0)
  useEffect(() => {
    setJumlah(0)
    let tick
    const mulai = setTimeout(() => {
      let i = 0
      tick = setInterval(() => {
        i += 1
        setJumlah(i)
        if (i >= teks.length) clearInterval(tick)
      }, jedaMs)
    }, mulaiMs)
    return () => {
      clearTimeout(mulai)
      clearInterval(tick)
    }
  }, [teks, mulaiMs, jedaMs])
  return teks.slice(0, jumlah)
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
  const sambutan = useKetik(t.demoSelamatDatangJudul, 1150)
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

  useEffect(() => {
    bunyikanSetelahSiap(playSambutKonsol)
  }, [])

  const PESAN_ERROR = {
    'auth/invalid-email': t.errInvalidCredential,
    'auth/invalid-credential': t.errInvalidCredential,
    'auth/too-many-requests': t.errTooManyRequests,
    'auth/network-request-failed': t.errNetworkFailed,
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (terblokir) return
    getar(12)
    playGoBuka()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, usernameKeEmail(username), password)
      simpanBlok({ gagal: 0, ke: 0, sampai: 0 }) // berhasil masuk: hitungan salah dan tingkat blokir dimulai dari awal
    } catch (err) {
      setError(PESAN_ERROR[err.code] || t.errGeneric)
      setLoading(false)
      if (KODE_SALAH.includes(err.code)) catatGagal()
    }
  }

  const [pemicuLogo, setPemicuLogo] = useState(0)
  function pilihDemo(peran, jalankan) {
    if (demoLoading) return
    getar(8)
    setDemoLoading(peran)
    setPemicuLogo((n) => n + 1)
    // jeda singkat supaya sisi yang menyala dan gelombang logo sempat terlihat sebelum pindah halaman
    setTimeout(() => handleDemo(peran, jalankan), 450)
  }

  async function handleDemo(peran, jalankan) {
    setError('')
    setDemoLoading(peran)
    try {
      await jalankan()
    } catch {
      setError(t.errGeneric)
      setDemoLoading('')
    }
  }

  const barDemo = (
  <div className="login-demo-bar">
    <button
      type="button"
      className="login-demo-btn"
      style={{ ...s.demoBtn, ...(demoLoading === 'ojek' ? s.demoPilihOjek : null) }}
      onClick={() => pilihDemo('ojek', masukDemoOjek)}
      disabled={Boolean(demoLoading)}
    >
      <span style={s.demoTeks}>{demoLoading === 'ojek' ? t.loginMemproses : t.demoOjek}</span>
    </button>
    <button
      type="button"
      className="login-demo-btn"
      style={{ ...s.demoBtn, ...(demoLoading === 'penumpang' ? s.demoPilihPenumpang : null) }}
      onClick={() => pilihDemo('penumpang', masukDemoPenumpang)}
      disabled={Boolean(demoLoading)}
    >
      <span style={s.demoTeks}>{demoLoading === 'penumpang' ? t.loginMemproses : t.demoPenumpang}</span>
    </button>
  </div>
  )

  return (
    <>
    {/* Latar CRT sengaja di luar <main>: selama animasi TV menyala <main> punya transform, dan elemen fixed di dalamnya
        jadi terkurung seukuran <main>, sehingga bagian bawah layar HP tampak kosong. */}
    <div className="login-latar-crt" aria-hidden="true" />
    <main className="login-tv" style={s.wrap}>
      <div className="login-garis-layar" aria-hidden="true" />
      <PilihBahasa style={s.bahasa} />

      <div style={s.brand}>
        <div style={s.logo} aria-label="GO-YAN">
          <span className="login-kedip">GO-YAN</span>
        </div>
        <div className="login-garis" style={{ '--d': '1000ms', marginBottom: 10 }} aria-hidden="true" />
        <div style={s.sambutan} aria-live="off">
          {sambutan}
          <span className="login-kursor" aria-hidden="true">_</span>
        </div>
        <h1 className="login-naik" style={{ ...s.title, '--d': '1250ms' }}>{t.loginTitle}</h1>
      </div>

      <form style={s.form} onSubmit={handleSubmit}>
        <label className="login-naik" style={{ ...s.label, '--d': '1400ms' }}>
          {t.loginUsername}
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
        </label>

        <label className="login-naik" style={{ ...s.label, '--d': '1500ms' }}>
          {t.loginPassword}
          <div style={s.pwWrap}>
            <input
              className="login-input"
              style={s.inputPw}
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
          </div>
        </label>

        {error && <div style={s.error}>{error}</div>}

        <button className="login-naik login-masuk-btn tekan" style={{ ...s.submit, '--d': '1600ms' }} type="submit" disabled={loading}>
          {loading ? t.loginMemproses : t.loginSubmit}
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
      <div className="login-naik" style={{ ...s.logoBawah, '--d': '1900ms' }}>
        <LogoLabaSentuh pemicu={pemicuLogo} />
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
    color: '#9FC3E8',
    marginBottom: 14,
  },
  eyebrow: { fontSize: 11, letterSpacing: '0.16em', color: 'var(--glow-blue)', marginBottom: 6, fontWeight: 700, textShadow: '0 0 6px var(--glow-blue-mid)' },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 34,
    color: 'var(--text)',
    letterSpacing: '1px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#9FC3E8' },
  input: {
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 0,
    padding: '13px 14px',
    fontSize: 15,
    color: 'var(--text)',
  },
  pwWrap: { position: 'relative' },
  inputPw: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 0,
    padding: '13px 44px 13px 14px',
    fontSize: 15,
    color: 'var(--text)',
  },
  pwToggle: {
    position: 'absolute',
    right: 6,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
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
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  demoDividerGaris: {
    flex: 1,
    height: 1,
    background: 'var(--blue-border)',
  },
  demoDividerTeks: {
    fontSize: 11.5,
    color: 'var(--text-dim)',
    letterSpacing: '0.04em',
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
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: '0.03em',
  },
}