import { useState } from 'react'
import { STATUS_PERMINTAAN } from '../lib/constants'
import { playSpiderSound } from '../lib/sound'
import GoPopup from '../components/GoPopup.jsx'
import BottomNav from '../components/BottomNav.jsx'
import HomeTab from './HomeTab.jsx'
import JadwalTab from './JadwalTab.jsx'
import RiwayatTab from './RiwayatTab.jsx'
import AccountTab from './AccountTab.jsx'

export default function PenumpangView({
  permintaanAktif,
  riwayat,
  jadwalMingguan,
  simpanJadwal,
  kirimGo,
  onBatal,
}) {
  const [tabAktif, setTabAktif] = useState('home')
  const [showGo, setShowGo] = useState(false)

  const statusSekarang = permintaanAktif?.status

  let modeGo = 'go'
  if (statusSekarang === STATUS_PERMINTAAN.MENUNGGU) modeGo = 'batal'
  else if (statusSekarang === STATUS_PERMINTAAN.DITERIMA) modeGo = 'disabled'

  function handleGoButtonClick() {
    if (modeGo === 'go') {
      setShowGo(true)
    } else if (modeGo === 'batal') {
      onBatal()
    }
  }

  async function handleKirimGo({ aksi, where, waktu }) {
    playSpiderSound()
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
        {tabAktif === 'akun' && <AccountTab />}
      </div>

      <BottomNav
        tabAktif={tabAktif}
        onTabChange={setTabAktif}
        onGoClick={handleGoButtonClick}
        modeGo={modeGo}
      />

      {showGo && <GoPopup onClose={() => setShowGo(false)} onSubmit={handleKirimGo} />}
    </>
  )
}

const s = {
  stageMap: { height: '100dvh', overflow: 'hidden' },
  stageScroll: { minHeight: '100dvh', overflowY: 'auto' },
}