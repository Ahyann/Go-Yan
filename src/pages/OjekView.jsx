import { useState } from 'react'
import OjekNav from '../components/OjekNav.jsx'
import OjekHomeTab from './OjekHomeTab.jsx'
import OjekJadwalTab from './OjekJadwalTab.jsx'
import OjekRiwayatTab from './OjekRiwayatTab.jsx'

export default function OjekView({ permintaan, riwayat, onTerima, onTolak, onSelesai, onTandaiLunas }) {
  const [tabAktif, setTabAktif] = useState('home')

  return (
    <>
      {tabAktif === 'home' && (
        <OjekHomeTab
          permintaan={permintaan}
          onTerima={onTerima}
          onTolak={onTolak}
          onSelesai={onSelesai}
        />
      )}
      {tabAktif === 'jadwal' && <OjekJadwalTab />}
      {tabAktif === 'riwayat' && (
        <OjekRiwayatTab riwayat={riwayat} onTandaiLunas={onTandaiLunas} />
      )}

      <OjekNav tabAktif={tabAktif} onTabChange={setTabAktif} />
    </>
  )
}