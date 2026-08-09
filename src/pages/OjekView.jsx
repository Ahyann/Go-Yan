import { useEffect, useRef, useState } from 'react'
import { useLokasiSaya } from '../lib/useLokasiSaya'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { playChatSound } from '../lib/sound'
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
  const [adaChatBaru, setAdaChatBaru] = useState(false)
  const tabAktifRef = useRef('home')

  useEffect(() => {
    tabAktifRef.current = tabAktif
  }, [tabAktif])

  const {
    aktif: lokasiAktif,
    error: lokasiError,
    mulai: mulaiLokasi,
    berhenti: berhentiLokasi,
  } = useLokasiSaya()

  // Pesan dari Fajri — dipantau di level ini biar ketahuan ada pesan
  // baru walau Ahyan lagi di tab lain (Jadwal/Riwayat/Akun).
  const { pesan: pesanMasuk } = usePesanPenumpang()
  const pesanTerakhirRef = useRef(undefined)

  useEffect(() => {
    if (pesanTerakhirRef.current === undefined) {
      pesanTerakhirRef.current = pesanMasuk?.dibuatPada ?? null
      return
    }

    const pesanBaru = pesanMasuk && pesanMasuk.dibuatPada !== pesanTerakhirRef.current
    if (pesanBaru) {
      pesanTerakhirRef.current = pesanMasuk.dibuatPada
      playChatSound()
      if (tabAktifRef.current !== 'home') setAdaChatBaru(true)
    }
  }, [pesanMasuk])

  function handleTabChange(tab) {
    setTabAktif(tab)
    if (tab === 'home') setAdaChatBaru(false)
  }

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

      <OjekNav tabAktif={tabAktif} onTabChange={handleTabChange} adaChatBaru={adaChatBaru} />
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
