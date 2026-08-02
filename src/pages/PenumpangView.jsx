import { useState } from 'react'
import GoPopup from '../components/GoPopup.jsx'
import BottomNav from '../components/BottomNav.jsx'
import HomeTab from './HomeTab.jsx'
import JadwalTab from './JadwalTab.jsx'
import RiwayatTab from './RiwayatTab.jsx'

export default function PenumpangView({
  permintaanAktif,
  riwayat,
  jadwalMingguan,
  simpanJadwal,
  kirimGo,
}) {
  const [tabAktif, setTabAktif] = useState('home')
  const [showGo, setShowGo] = useState(false)

  async function handleKirimGo({ aksi, where, waktu }) {
    await kirimGo({ aksi, where, waktu })
    setShowGo(false)
  }

  return (
    <>
      <div style={tabAktif === 'home' ? s.stageMap : s.stageScroll}>
        {tabAktif === 'home' && <HomeTab permintaan={permintaanAktif} />}
        {tabAktif === 'jadwal' && (
          <JadwalTab jadwalMingguan={jadwalMingguan} simpanJadwal={simpanJadwal} />
        )}
        {tabAktif === 'riwayat' && <RiwayatTab riwayat={riwayat} />}
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
  stageMap: { height: '100dvh', overflow: 'hidden' },
  stageScroll: { minHeight: '100dvh', overflowY: 'auto' },
}