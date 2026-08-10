import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { usePermintaanAktif } from './lib/usePermintaanAktif'
import { useRiwayat } from './lib/useRiwayat'
import { useJadwalMingguan } from './lib/useJadwalMingguan'
import { dengarkanNotifForeground, kirimNotifikasi } from './lib/notifikasi'
import { usePresence } from './lib/usePresence'
import { usePesananSelesai } from './lib/usePesananSelesai'
import LoginPage from './pages/LoginPage.jsx'
import OjekView from './pages/OjekView.jsx'
import PenumpangView from './pages/PenumpangView.jsx'
import { ROLE, TARIF_PER_RIDE, STATUS_BAYAR } from './lib/constants'

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppIsi />
      </LanguageProvider>
    </AuthProvider>
  )
}

function AppIsi() {
  const { user, role, logout } = useAuth()
  const { permintaan, kirimGo, terima, tolak, selesai, batal } = usePermintaanAktif()
  const { riwayat, siap: riwayatSiap, tambahRiwayat, tandaiLunas, hapusRiwayat } = useRiwayat()
  const { jadwal: jadwalMingguan, simpanJadwal } = useJadwalMingguan()
  const { data: notifSelesaiData, tandaiSelesai, hapusNotifSelesai } = usePesananSelesai()
  usePresence(role)

  useEffect(() => {
    dengarkanNotifForeground((payload) => {
      console.log('Notif diterima saat app kebuka:', payload)
    })
  }, [])

  async function selesaikanRide() {
    if (!permintaan) return
    const tanggal = new Date().toISOString().slice(0, 10)
    await tambahRiwayat({
      tanggal,
      jam: new Date().toTimeString().slice(0, 5),
      tarif: TARIF_PER_RIDE,
      statusBayar: STATUS_BAYAR.BELUM,
      aksi: permintaan.aksi,
      where: permintaan.where,
    })
    await tandaiSelesai({ tanggal, tarif: TARIF_PER_RIDE })
    kirimNotifikasi(
      'penumpang',
      'Perjalanan Selesai! 🎉',
      `${permintaan.aksi === 'jemput' ? 'Jemput' : 'Antar'} · ${permintaan.where}`,
      'selesai'
    )
    await selesai()
  }

  if (user === undefined) {
    return (
      <div style={s.loading}>
        <div style={s.loadingEyebrow}>GO-YAN</div>
        <svg className="app-loading-ring" width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="16" stroke="rgba(94,208,255,0.15)" strokeWidth="4" />
          <circle
            cx="20" cy="20" r="16"
            stroke="var(--glow-blue)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray="100" strokeDashoffset="72"
          />
        </svg>
      </div>
    )
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
          riwayatSiap={riwayatSiap}
          jadwalMingguan={jadwalMingguan}
          onTerima={terima}
          onTolak={tolak}
          onSelesai={selesaikanRide}
          onTandaiLunas={tandaiLunas}
          onHapusRiwayat={hapusRiwayat}
        />
      ) : (
        <PenumpangView
          permintaanAktif={permintaan}
          riwayat={riwayat}
          riwayatSiap={riwayatSiap}
          jadwalMingguan={jadwalMingguan}
          simpanJadwal={simpanJadwal}
          kirimGo={kirimGo}
          onBatal={batal}
          notifSelesaiData={notifSelesaiData}
          onDismissNotifSelesai={hapusNotifSelesai}
        />
      )}
    </>
  )
}

const s = {
  loading: {
    minHeight: 'var(--app-height, 100dvh)',
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
  loadingEyebrow: {
    fontFamily: 'var(--font-judul)',
    fontSize: 20,
    letterSpacing: '1px',
    color: 'var(--glow-blue)',
    textShadow: '0 0 8px var(--glow-blue-mid)',
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
}