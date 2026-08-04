import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { usePermintaanAktif } from './lib/usePermintaanAktif'
import { useRiwayat } from './lib/useRiwayat'
import { useJadwalMingguan } from './lib/useJadwalMingguan'
import { mintaIzinDanSimpanToken, dengarkanNotifForeground } from './lib/notifikasi'
import { usePresence } from './lib/usePresence'
import LoginPage from './pages/LoginPage.jsx'
import OjekView from './pages/OjekView.jsx'
import PenumpangView from './pages/PenumpangView.jsx'
import { ROLE, TARIF_PER_RIDE, STATUS_BAYAR } from './lib/constants'

export default function App() {
  return (
    <AuthProvider>
      <AppIsi />
    </AuthProvider>
  )
}

function AppIsi() {
  const { user, role, logout } = useAuth()
  const { permintaan, kirimGo, terima, tolak, selesai, batal } = usePermintaanAktif()
  const { riwayat, tambahRiwayat, tandaiLunas, hapusRiwayat } = useRiwayat()
  const { jadwal: jadwalMingguan, simpanJadwal } = useJadwalMingguan()
  const [notifOjek, setNotifOjek] = useState('')
  usePresence(role)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotifOjek('ok')
    }

    dengarkanNotifForeground((payload) => {
      console.log('Notif diterima saat app kebuka:', payload)
    })
  }, [])

  async function handleAktifkanNotifOjek() {
    const hasil = await mintaIzinDanSimpanToken(user.uid, ROLE.OJEK)
    if (hasil.berhasil) setNotifOjek('ok')
    else alert(hasil.alasan)
  }

  async function selesaikanRide() {
    if (!permintaan) return
    await tambahRiwayat({
      tanggal: new Date().toISOString().slice(0, 10),
      jam: new Date().toTimeString().slice(0, 5),
      tarif: TARIF_PER_RIDE,
      statusBayar: STATUS_BAYAR.BELUM,
      aksi: permintaan.aksi,
      where: permintaan.where,
    })
    await selesai()
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
        <>
          <OjekView
            permintaan={permintaan}
            riwayat={riwayat}
            jadwalMingguan={jadwalMingguan}
            onTerima={terima}
            onTolak={tolak}
            onSelesai={selesaikanRide}
            onTandaiLunas={tandaiLunas}
            onHapusRiwayat={hapusRiwayat}
          />
          <button style={s.logoutFloat} onClick={logout} aria-label="Keluar">
            ⎋
          </button>
          <button
            style={notifOjek === 'ok' ? s.notifFloatOk : s.notifFloat}
            onClick={handleAktifkanNotifOjek}
            aria-label="Aktifkan notifikasi"
            disabled={notifOjek === 'ok'}
          >
            {notifOjek === 'ok' ? '🔔' : '🔕'}
          </button>
        </>
      ) : (
        <PenumpangView
          permintaanAktif={permintaan}
          riwayat={riwayat}
          jadwalMingguan={jadwalMingguan}
          simpanJadwal={simpanJadwal}
          kirimGo={kirimGo}
          onBatal={batal}
        />
      )}
    </>
  )
}

const s = {
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
  notifFloat: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 12px)',
    right: 60,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    color: 'var(--text-dim)',
    fontSize: 15,
    zIndex: 1000,
  },
  notifFloatOk: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 12px)',
    right: 60,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(74,222,128,0.15)',
    border: '1px solid var(--signal)',
    color: 'var(--signal)',
    fontSize: 15,
    zIndex: 1000,
  },
}