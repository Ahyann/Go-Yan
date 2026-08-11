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

// Format tanggal pake komponen LOKAL (bukan toISOString, yang itungannya
// ikut UTC) — penting soalnya kalau pake UTC, pas dini hari WIB (misal
// jam 00:00-06:59), UTC-nya masih di HARI SEBELUMNYA, bikin tanggal di
// riwayat keliru mundur 1 hari.
function tanggalLokalHariIni() {
  const d = new Date()
  const tahun = d.getFullYear()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const tanggal = String(d.getDate()).padStart(2, '0')
  return `${tahun}-${bulan}-${tanggal}`
}

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
  const { jadwal: jadwalMingguan, simpanJadwal, tandaiSelesai: tandaiSelesaiJadwal } = useJadwalMingguan()
  const { data: notifSelesaiData, tandaiSelesai, hapusNotifSelesai } = usePesananSelesai()
  usePresence(role)

  useEffect(() => {
    dengarkanNotifForeground((payload) => {
      console.log('Notif diterima saat app kebuka:', payload)
    })
  }, [])

  async function selesaikanRide() {
    if (!permintaan) return
    const tanggal = tanggalLokalHariIni()
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
        <div style={s.eqRow}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span
              key={i}
              className="eq-bar"
              style={{ ...s.eqBar, animationDelay: `${(i % 4) * 0.12}s` }}
            />
          ))}
        </div>
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
          onTandaiSelesaiJadwal={tandaiSelesaiJadwal}
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
  eqRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 5,
    height: 26,
  },
  eqBar: {
    width: 6,
    height: 26,
    borderRadius: 3,
    background: 'var(--glow-blue)',
    boxShadow: '0 0 6px var(--glow-blue-mid)',
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
