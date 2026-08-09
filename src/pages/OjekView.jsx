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
  const [idRiwayatBaru, setIdRiwayatBaru] = useState(null)
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

  // riwayat[0] SELALU yang paling baru ditambahin (di-orderBy
  // dibuatPada desc dari Firestore) — tinggal bandingin ID-nya.
  const [adaRiwayatBaru, setAdaRiwayatBaru] = useState(false)
  const riwayatTerakhirRef = useRef(undefined)

  useEffect(() => {
    const idTerbaru = riwayat[0]?.id
    if (riwayatTerakhirRef.current === undefined) {
      riwayatTerakhirRef.current = idTerbaru ?? null
      return
    }

    if (idTerbaru && idTerbaru !== riwayatTerakhirRef.current) {
      riwayatTerakhirRef.current = idTerbaru
      setIdRiwayatBaru(idTerbaru)
      if (tabAktifRef.current !== 'riwayat') setAdaRiwayatBaru(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riwayat])

  function handleTabChange(tab) {
    setTabAktif(tab)
    if (tab === 'home') setAdaChatBaru(false)
    if (tab === 'riwayat') {
      setAdaRiwayatBaru(false)
      setIdRiwayatBaru(null)
    }
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
          <OjekRiwayatTab
            riwayat={riwayat}
            onTandaiLunas={onTandaiLunas}
            onHapusRiwayat={onHapusRiwayat}
            idBaru={idRiwayatBaru}
          />
        )}
        {tabAktif === 'akun' && <OjekAccountTab />}
      </div>

      <OjekNav
        tabAktif={tabAktif}
        onTabChange={handleTabChange}
        adaChatBaru={adaChatBaru}
        adaRiwayatBaru={adaRiwayatBaru}
      />
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
