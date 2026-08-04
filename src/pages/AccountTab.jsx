import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE } from '../lib/constants'
import { mintaIzinDanSimpanToken } from '../lib/notifikasi'

export default function AccountTab() {
  const { user, logout } = useAuth()
  const [status, setStatus] = useState('')
  const [pesanError, setPesanError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setStatus('ok')
    }
  }, [])

  async function handleAktifkanNotif() {
    setStatus('loading')
    setPesanError('')
    const hasil = await mintaIzinDanSimpanToken(user.uid, ROLE.PENUMPANG)
    if (hasil.berhasil) {
      setStatus('ok')
    } else {
      setStatus('gagal')
      setPesanError(hasil.alasan)
    }
  }

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

      <section style={s.card}>
        <div style={s.label}>Notifikasi</div>
        <div style={s.notifDesc}>
          Dapetin notif pas Ahyan otw / kirim pesan, walau app-nya lagi ditutup.
        </div>
        <button
          style={status === 'ok' ? s.notifBtnOk : s.notifBtn}
          onClick={handleAktifkanNotif}
          disabled={status === 'loading' || status === 'ok'}
        >
          {status === 'ok' ? '✓ Notifikasi aktif' : status === 'loading' ? 'Memproses…' : 'Aktifkan Notifikasi'}
        </button>
        {status === 'gagal' && <div style={s.notifError}>{pesanError}</div>}
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
  notifDesc: { fontSize: 13, color: '#8FB4DC', marginBottom: 14, lineHeight: 1.4 },
  notifBtn: {
    width: '100%',
    background: 'var(--glow-blue-mid)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },
  notifBtnOk: {
    width: '100%',
    background: 'rgba(74,222,128,0.15)',
    color: 'var(--signal)',
    fontSize: 14,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
    border: '1px solid var(--signal)',
  },
  notifError: { fontSize: 12, color: 'var(--web-red)', marginTop: 8, textAlign: 'center' },
  logoutBtn: {
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 999,
  },
}