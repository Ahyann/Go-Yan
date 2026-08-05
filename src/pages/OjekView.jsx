import { useState } from 'react'
import { useLokasiSaya } from '../lib/useLokasiSaya'
import OjekNav from '../components/OjekNav.jsx'
import OjekHomeTab from './OjekHomeTab.jsx'
import OjekJadwalTab from './OjekJadwalTab.jsx'
import OjekRiwayatTab from './OjekRiwayatTab.jsx'
import OjekAccountTab from './OjekAccountTab.jsx'

export default function OjekView({
  permintaan,
  riwayat,
  jadwalMingguan,
  onTerima,
  onTolak,
  onSelesai,
  onTandaiLunas,
  onHapusRiwayat,
}) {
  const [tabAktif, setTabAktif] = useState('home')

  // Hook GPS ini di level OjekView (bukan di dalem OjekHomeTab) —
  // biar statusnya TETEP JALAN walau Ahyan pindah-pindah tab
  // (Jadwal/Riwayat). Sebelumnya nempel di OjekHomeTab, jadi begitu
  // komponen itu dihancurin pas ganti tab, GPS-nya beneran berhenti
  // ke-share, bukan cuma tampilannya doang yang salah.
  const {
    aktif: lokasiAktif,
    error: lokasiError,
    mulai: mulaiLokasi,
    berhenti: berhentiLokasi,
  } = useLokasiSaya()

  return (
    <div style={s.appWrap}>
      <div style={s.stageScroll}>
        {tabAktif === 'home' && (
          <OjekHomeTab
            permintaan={permintaan}
            onTerima={onTerima}
            onTolak={onTolak}
            onSelesai={onSelesai}
            lokasiAktif={lokasiAktif}
            lokasiError={lokasiError}
            mulaiLokasi={mulaiLokasi}
            berhentiLokasi={berhentiLokasi}
          />
        )}
        {tabAktif === 'jadwal' && <OjekJadwalTab jadwalMingguan={jadwalMingguan} />}
        {tabAktif === 'riwayat' && (
          <OjekRiwayatTab riwayat={riwayat} onTandaiLunas={onTandaiLunas} onHapusRiwayat={onHapusRiwayat} />
        )}
        {tabAktif === 'akun' && <OjekAccountTab />}
      </div>

      <OjekNav tabAktif={tabAktif} onTabChange={setTabAktif} />
    </div>
  )
}

const s = {
  appWrap: {
    display: 'flex',
    flexDirection: 'column',
    height: 'var(--app-height, 100dvh)',
    maxWidth: 480,
    margin: '0 auto',
  },
  stageScroll: { flex: 1, overflowY: 'auto' },
}
