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
    // undefined = belum pernah ke-cek sama sekali (baru pertama kali
    // hook ini jalan) — jangan bunyi/nyalain badge buat pesan LAMA
    // yang udah ada dari sebelumnya, cuma buat pesan yang BENERAN
    // baru dateng SELAMA Fajri lagi di app.
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
        {tabAktif === 'riwayat' && <RiwayatTab riwayat={riwayat} />}
        {tabAktif === 'akun' && <AccountTab />}
      </div>

      <BottomNav
        tabAktif={tabAktif}
        onTabChange={handleTabChange}
        onGoClick={handleGoButtonClick}
        modeGo={modeGo}
        adaChatBaru={adaChatBaru}
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
