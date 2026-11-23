import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import PilihBahasa from '../components/PilihBahasa.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { bunyikanSetelahSiap, playSambutKonsol, playGoBuka } from '../lib/sound'
import { getar } from '../lib/getar'

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
    getar(12)
    playGoBuka()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, usernameKeEmail(username), password)
    } catch (err) {
      setError(PESAN_ERROR[err.code] || t.errGeneric)
      setLoading(false)
    }
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
        <div className="login-demo-bar">
          <button
            type="button"
            className="login-demo-btn"
            style={s.demoBtn}
            onClick={() => { getar(8); handleDemo('ojek', masukDemoOjek) }}
            disabled={Boolean(demoLoading)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2.5C6.7 2.5 3 6.5 3 12s3.7 9.5 9 9.5 9-4 9-9.5-3.7-9.5-9-9.5z" />
              <path d="M5.2 9.6c3.2.3 5.2 2 6.1 5-2.6 1.6-5.3.9-6.9-1.6z" />
              <path d="M18.8 9.6c-3.2.3-5.2 2-6.1 5 2.6 1.6 5.3.9 6.9-1.6z" />
            </svg>
            <span style={s.demoTeks}>{demoLoading === 'ojek' ? t.loginMemproses : t.demoOjek}</span>
          </button>
          <button
            type="button"
            className="login-demo-btn"
            style={s.demoBtn}
            onClick={() => { getar(8); handleDemo('penumpang', masukDemoPenumpang) }}
            disabled={Boolean(demoLoading)}
          >
            <svg width="22" height="22" viewBox="-2 -2 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="5" r="3"/><path d="M2 15c0-3.3 2.7-5 6-5s6 1.7 6 5"/></svg>
            <span style={s.demoTeks}>{demoLoading === 'penumpang' ? t.loginMemproses : t.demoPenumpang}</span>
          </button>
        </div>
      </div>
    </main>
    </>
  )
}

const s = {
  wrap: {
    position: 'relative',
    zIndex: 1, // di atas latar CRT
    minHeight: 'var(--app-height, 100dvh)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '24px 24px calc(var(--safe-bottom) + 24px)',
    maxWidth: 400,
    margin: '0 auto',
  },
  // Pilihan bahasa kecil di pojok kanan atas.
  bahasa: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 14px)',
    right: 24,
  },
  brand: { marginBottom: 32 },
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
  demoWrap: {
    marginTop: 24,
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