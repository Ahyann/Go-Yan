import { useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import OjekView from './pages/OjekView.jsx'
import PenumpangView from './pages/PenumpangView.jsx'
import { STATUS_PERMINTAAN } from './lib/constants'

export default function App() {
  const [permintaanAktif, setPermintaanAktif] = useState(null)

  function terimaPermintaan() {
    setPermintaanAktif((p) => (p ? { ...p, status: STATUS_PERMINTAAN.DITERIMA } : p))
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/ojek" replace />} />
        <Route
          path="/ojek"
          element={<OjekView permintaan={permintaanAktif} onTerima={terimaPermintaan} />}
        />
        <Route
          path="/penumpang"
          element={
            <PenumpangView
              permintaanAktif={permintaanAktif}
              setPermintaanAktif={setPermintaanAktif}
            />
          }
        />
        <Route path="*" element={<Navigate to="/ojek" replace />} />
      </Routes>
      <RoleSwitcher />
    </>
  )
}

function RoleSwitcher() {
  const { pathname } = useLocation()
  return (
    <div style={s.switcher}>
      <Link to="/ojek" style={pathname === '/ojek' ? s.active : s.link}>Ojek</Link>
      <Link to="/penumpang" style={pathname === '/penumpang' ? s.active : s.link}>Penumpang</Link>
    </div>
  )
}

const s = {
  switcher: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 10px)',
    right: 16,
    display: 'flex',
    gap: 6,
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 999,
    padding: 4,
    zIndex: 10,
  },
  link: {
    fontSize: 12,
    padding: '6px 12px',
    borderRadius: 999,
    color: 'var(--text-dim)',
    textDecoration: 'none',
  },
  active: {
    fontSize: 12,
    padding: '6px 12px',
    borderRadius: 999,
    background: 'var(--web-red)',
    color: '#fff',
    textDecoration: 'none',
  },
}