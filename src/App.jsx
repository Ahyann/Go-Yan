import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OjekView from './pages/OjekView.jsx'
import PenumpangView from './pages/PenumpangView.jsx'
import { ROLE, STATUS_PERMINTAAN } from './lib/constants'

export default function App() {
  return (
    <AuthProvider>
      <AppIsi />
    </AuthProvider>
  )
}

function AppIsi() {
  const { user, role, logout } = useAuth()
  const [permintaanAktif, setPermintaanAktif] = useState(null)

  function terimaPermintaan() {
    setPermintaanAktif((p) => (p ? { ...p, status: STATUS_PERMINTAAN.DITERIMA } : p))
  }

  function tolakPermintaan() {
    setPermintaanAktif((p) => (p ? { ...p, status: STATUS_PERMINTAAN.DITOLAK } : p))
  }

  if (user === undefined) {
    return <div style={s.loading}>Memuat…</div>
  }

  if (!user) {
    return <LoginPage />
  }

  if (!role) {
    return (
      <div style={s.loading}>
        <p>Akun ini belum terdaftar sebagai ojek atau penumpang.</p>
        <p style={s.uidDebug}>UID: {user.uid}</p>
        <button style={s.logoutBtn} onClick={logout}>Keluar</button>
      </div>
    )
  }

  return (
    <>
      {role === ROLE.OJEK ? (
        <OjekView permintaan={permintaanAktif} onTerima={terimaPermintaan} onTolak={tolakPermintaan} />
      ) : (
        <PenumpangView permintaanAktif={permintaanAktif} setPermintaanAktif={setPermintaanAktif} />
      )}
      <button style={s.logoutFloat} onClick={logout} aria-label="Keluar">
        ⎋
      </button>
    </>
  )
}

const s = {
  uidDebug: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'var(--text-dim)',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: '8px 12px',
    userSelect: 'all',
  },
  loading: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    color: 'var(--text-dim)',
    fontSize: 14,
    padding: 24,
    textAlign: 'center',
  },
  logoutBtn: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 999,
    padding: '10px 18px',
    color: 'var(--text)',
    fontSize: 13.5,
  },
  logoutFloat: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 12px)',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    color: 'var(--text-dim)',
    fontSize: 16,
    zIndex: 1000,
  },
}