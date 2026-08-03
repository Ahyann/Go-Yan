import { useState } from 'react'
import OjekNav from '../components/OjekNav.jsx'
import OjekHomeTab from './OjekHomeTab.jsx'
import OjekJadwalTab from './OjekJadwalTab.jsx'
import OjekRiwayatTab from './OjekRiwayatTab.jsx'

export default function OjekView({
  permintaan,
  riwayat,
  jadwalMingguan,
  onTerima,
  onTolak,
  onSelesai,
  onTandaiLunas,
}) {
  const [tabAktif, setTabAktif] = useState('home')

  return (
    <div style={s.appWrap}>
      <div style={s.stageScroll}>
        {tabAktif === 'home' && (
          <OjekHomeTab
            permintaan={permintaan}
            onTerima={onTerima}
            onTolak={onTolak}
            onSelesai={onSelesai}
          />
        )}
        {tabAktif === 'jadwal' && <OjekJadwalTab jadwalMingguan={jadwalMingguan} />}
        {tabAktif === 'riwayat' && (
          <OjekRiwayatTab riwayat={riwayat} onTandaiLunas={onTandaiLunas} />
        )}
      </div>

      <OjekNav tabAktif={tabAktif} onTabChange={setTabAktif} />
    </div>
  )
}

const s = {
  appWrap: { display: 'flex', flexDirection: 'column', height: '100dvh' },
  stageScroll: { flex: 1, overflowY: 'auto' },
}