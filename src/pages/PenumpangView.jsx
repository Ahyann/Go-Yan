import { useEffect, useRef, useState } from 'react'
import { STATUS_PERMINTAAN } from '../lib/constants'
import { playSpiderSound, playChatSound } from '../lib/sound'
import { useLokasiSayaPenumpang } from '../lib/useLokasiSayaPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import GoPopup from '../components/GoPopup.jsx'
import SelesaiPopup from '../components/SelesaiPopup.jsx'
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
  notifSelesaiData,
  onDismissNotifSelesai,
}) {
  const [tabAktif, setTabAktif] = useState('home')
  const [showGo, setShowGo] = useState(false)
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
  } = useLokasiSayaPenumpang()

  // Pesan dari Ahyan — dipantau di level ini (bukan di dalem HomeTab)
  // biar KETAHUAN ada pesan baru walau Fajri lagi di tab lain, bukan
  // cuma pas lagi liat peta doang.
  const { pesan: pesanMasuk } = usePesanOjek()
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
  // dibuatPada desc dari Firestore) — jadi tinggal bandingin ID-nya
  // doang buat tau ada entri baru apa enggak.
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

  const statusSekarang = permintaanAktif?.status
  const sedangJalan = statusSekarang === STATUS_PERMINTAAN.DITERIMA

  useEffect(() => {
    if (!sedangJalan && lokasiAktif) {
      berhentiLokasi()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedangJalan])

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
        {tabAktif === 'home' && (
          <HomeTab
            permintaan={permintaanAktif}
            lokasiAktif={lokasiAktif}
            lokasiError={lokasiError}
            mulaiLokasi={mulaiLokasi}
            berhentiLokasi={berhentiLokasi}
          />
        )}
        {tabAktif === 'jadwal' && (
          <JadwalTab jadwalMingguan={jadwalMingguan} simpanJadwal={simpanJadwal} />
        )}
        {tabAktif === 'riwayat' && (
          <RiwayatTab riwayat={riwayat} idBaru={idRiwayatBaru} />
        )}
        {tabAktif === 'akun' && <AccountTab />}
      </div>

      <BottomNav
        tabAktif={tabAktif}
        onTabChange={handleTabChange}
        onGoClick={handleGoButtonClick}
        modeGo={modeGo}
        adaChatBaru={adaChatBaru}
        adaRiwayatBaru={adaRiwayatBaru}
      />

      {showGo && <GoPopup onClose={() => setShowGo(false)} onSubmit={handleKirimGo} />}

      {notifSelesaiData && (
        <SelesaiPopup data={notifSelesaiData} onDismiss={onDismissNotifSelesai} />
      )}
    </>
  )
}

const s = {
  stageMap: { height: 'var(--app-height, 100dvh)', overflow: 'hidden' },
  stageScroll: { minHeight: 'var(--app-height, 100dvh)', overflowY: 'auto' },
}
