import { useAuth } from '../context/AuthContext.jsx'

export default function AccountTab() {
  const { user, logout } = useAuth()

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>AKUN</div>
        <h1 style={s.title}>Pengaturan</h1>
      </header>

      <section style={s.card}>
        <div style={s.label}>Masuk sebagai</div>
        <div style={s.email}>{user?.email}</div>
      </section>

      <button style={s.logoutBtn} onClick={logout}>
        Keluar
      </button>
    </main>
  )
}

const s = {
  wrap: {
    minHeight: '100%',
    padding: 'calc(var(--safe-top) + 24px) 20px 110px',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {},
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 24,
    color: 'var(--text)',
    letterSpacing: '1px',
  },
  card: {
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 12,
    padding: 18,
  },
  label: { fontSize: 12.5, color: '#9FC3E8', marginBottom: 6 },
  email: { fontSize: 15, color: 'var(--text)', fontWeight: 600 },
  logoutBtn: {
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 999,
  },
}