import { useState } from 'react'
import { dummyJadwal, dummyRiwayat } from '../lib/dummyData'
import { STATUS_RIDE, STATUS_PERMINTAAN, AKSI } from '../lib/constants'
import GoPopup from '../components/GoPopup.jsx'
import BottomNav from '../components/BottomNav.jsx'
import HomeTab from './HomeTab.jsx'
import RiwayatTab from './RiwayatTab.jsx'

export default function PenumpangView({ permintaanAktif, setPermintaanAktif }) {
  const [tabAktif, setTabAktif] = useState('home')
  const [jadwal, setJadwal] = useState(dummyJadwal)
  const [showGo, setShowGo] = useState(false)

  function handleKirimGo({ aksi, where, waktu }) {
    const labelAksi = aksi === AKSI.JEMPUT ? 'Jemput' : 'Antar'
    const entriBaru = {
      id: `go-${Date.now()}`,
      tanggal: new Date().toISOString().slice(0, 10),
      jam: waktu,
      catatan: `${labelAksi} · ${where}`,
      status: STATUS_RIDE.DIJADWALKAN,
    }
    setJadwal((daftarLama) => [entriBaru, ...daftarLama])
    setPermintaanAktif({ aksi, where, waktu, status: STATUS_PERMINTAAN.MENUNGGU })
    setShowGo(false)
  }

  return (
    <>
      <div style={s.stage}>
        {tabAktif === 'home' ? (
          <HomeTab permintaan={permintaanAktif} />
        ) : (
          <RiwayatTab jadwal={jadwal} riwayat={dummyRiwayat} />
        )}
      </div>

      <BottomNav
        tabAktif={tabAktif}
        onTabChange={setTabAktif}
        onGoClick={() => setShowGo(true)}
      />

      {showGo && <GoPopup onClose={() => setShowGo(false)} onSubmit={handleKirimGo} />}
    </>
  )
}

const s = {
  stage: { height: '100dvh', overflow: 'hidden' },
}