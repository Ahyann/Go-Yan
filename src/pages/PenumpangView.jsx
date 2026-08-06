import { useEffect, useState } from 'react'
import { STATUS_PERMINTAAN } from '../lib/constants'
import { playSpiderSound } from '../lib/sound'
import { useLokasiSayaPenumpang } from '../lib/useLokasiSayaPenumpang'
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

  // Hook GPS ini sekarang di level PenumpangView (bukan di dalem
  // HomeTab) — biar statusnya TETEP JALAN walau user pindah-pindah
  // tab (Jadwal/Riwayat/Akun). Sebelumnya ini nempel di HomeTab, jadi
  // begitu HomeTab dihancurin pas ganti tab, GPS-nya beneran berhenti
  // ke-share, bukan cuma tampilannya doang yang salah.
  const {
    aktif: lokasiAktif,
    error: lokasiError,
    mulai: mulaiLokasi,
    berhenti: berhentiLokasi,
  } = useLokasiSayaPenumpang()

  const statusSekarang = permintaanAktif?.status
  const sedangJalan = statusSekarang === STATUS_PERMINTAAN.DITERIMA

  // Begitu ride udah gak aktif lagi, otomatis matiin share lokasi.
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
        onTabChange={setTabAktif}
        onGoClick={handleGoButtonClick}
        modeGo={modeGo}
      />

      {showGo && <GoPopup onClose={() => setShowGo(false)} onSubmit={handleKirimGo} />}

      {/* Ditaro di sini (bukan di dalem HomeTab) — biar tetep keliatan
          walau Fajri lagi di tab Jadwal/Riwayat/Akun, bukan cuma pas
          lagi di Home doang. */}
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
