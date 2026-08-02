import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { usePermintaanAktif } from './lib/usePermintaanAktif'
import { useRiwayat } from './lib/useRiwayat'
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
  const { permintaan, kirimGo, terima, tolak, selesai } = usePermintaanAktif()
  const { riwayat, tambahRiwayat, tandaiLunas } = useRiwayat()

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
        <OjekView
          permintaan={permintaan}
          riwayat={riwayat}
          onTerima={terima}
          onTolak={tolak}
          onSelesai={selesaikanRide}
          onTandaiLunas={tandaiLunas}
        />
      ) : (
        <PenumpangView permintaanAktif={permintaan} riwayat={riwayat} kirimGo={kirimGo} />
      )}
      <button style={s.logoutFloat} onClick={logout} aria-label="Keluar">
        ⎋
      </button>
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
}