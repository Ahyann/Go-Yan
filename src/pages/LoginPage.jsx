import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext.jsx'

function usernameKeEmail(username) {
  const bersih = username.trim().toLowerCase().replace(/\s+/g, '')
  return `${bersih}@gmail.com`
}

export default function LoginPage() {
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tampilkanPw, setTampilkanPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const PESAN_ERROR = {
    'auth/invalid-email': t.errInvalidCredential,
    'auth/invalid-credential': t.errInvalidCredential,
    'auth/too-many-requests': t.errTooManyRequests,
    'auth/network-request-failed': t.errNetworkFailed,
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, usernameKeEmail(username), password)
    } catch (err) {
      setError(PESAN_ERROR[err.code] || t.errGeneric)
      setLoading(false)
    }
  }

  return (
    <main style={s.wrap}>
      <div style={s.brand}>
        <div style={s.eyebrow}>GO-YAN</div>
        <h1 style={s.title}>{t.loginTitle}</h1>
      </div>

      <form style={s.form} onSubmit={handleSubmit}>
        <label style={s.label}>
          {t.loginUsername}
          <input
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

        <label style={s.label}>
          {t.loginPassword}
          <div style={s.pwWrap}>
            <input
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

        <button style={s.submit} type="submit" disabled={loading}>
          {loading ? t.loginMemproses : t.loginSubmit}
        </button>
      </form>
    </main>
  )
}

const s = {
  wrap: {
    minHeight: 'var(--app-height, 100dvh)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '24px 24px calc(var(--safe-bottom) + 24px)',
    maxWidth: 400,
    margin: '0 auto',
  },
  brand: { marginBottom: 32 },
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 8,
  },
  error: {
    fontSize: 13,
    color: 'var(--web-red)',
    background: 'var(--card-blue)',
    border: '1px solid var(--web-red)',
    borderRadius: 10,
    padding: '10px 14px',
  },
  submit: {
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 999,
    marginTop: 6,
  },
}