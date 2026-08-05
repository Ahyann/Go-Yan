import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function LoginPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const PESAN_ERROR = {
    'auth/invalid-email': t.errInvalidEmail,
    'auth/invalid-credential': t.errInvalidCredential,
    'auth/too-many-requests': t.errTooManyRequests,
    'auth/network-request-failed': t.errNetworkFailed,
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
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
          {t.loginEmail}
          <input
            style={s.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label style={s.label}>
          {t.loginPassword}
          <input
            style={s.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
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
