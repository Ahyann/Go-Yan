import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'

const PESAN_ERROR = {
  'auth/invalid-email': 'Format email belum benar.',
  'auth/invalid-credential': 'Email atau password salah.',
  'auth/too-many-requests': 'Terlalu banyak percobaan gagal. Coba lagi sebentar.',
  'auth/network-request-failed': 'Gak ada koneksi internet.',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      setError(PESAN_ERROR[err.code] || 'Gagal masuk, coba lagi.')
      setLoading(false)
    }
  }

  return (
    <main style={s.wrap}>
      <div style={s.brand}>
        <div style={s.eyebrow}>GO-YAN</div>
        <h1 style={s.title}>Masuk</h1>
      </div>

      <form style={s.form} onSubmit={handleSubmit}>
        <label style={s.label}>
          Email
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
          Password
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
          {loading ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}

const s = {
  wrap: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '24px 24px calc(var(--safe-bottom) + 24px)',
    maxWidth: 400,
    margin: '0 auto',
  },
  brand: { marginBottom: 32 },
  eyebrow: { fontSize: 11, letterSpacing: '0.16em', color: 'var(--web-red)', marginBottom: 6, fontWeight: 700 },
  title: { fontSize: 30, letterSpacing: '-0.01em' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-dim)' },
  input: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '13px 14px',
    fontSize: 15,
    color: 'var(--text)',
  },
  error: {
    fontSize: 13,
    color: 'var(--web-red)',
    background: 'var(--surface)',
    border: '1px solid var(--web-red)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
  },
  submit: {
    background: 'var(--web-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 999,
    marginTop: 6,
  },
}