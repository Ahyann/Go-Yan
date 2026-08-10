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

const KEY_TERAKHIR_DILIHAT = 'go-yan-riwayat-terakhir-dilihat-penumpang'

function ambilTerakhirDilihat() {
  try {
    const raw = localStorage.getItem(KEY_TERAKHIR_DILIHAT)
    if (raw === null) return null
    return Number(raw)
  } catch {
    return null
  }
}

function simpanTerakhirDilihat(waktu) {
  try {
    localStorage.setItem(KEY_TERAKHIR_DILIHAT, String(waktu))
  } catch {}
}

export default function PenumpangView({
  permintaanAktif,
  riwayat,
  riwayatSiap,
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
  const [adaRiwayatBaru, setAdaRiwayatBaru] = useState(false)
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

  const terakhirDilihatRef = useRef(undefined)

  useEffect(() => {
    if (!riwayatSiap) return

    if (terakhirDilihatRef.current === undefined) {
      const tersimpan = ambilTerakhirDilihat()
      if (tersimpan === null) {
        const maxWaktu = riwayat.reduce((max, r) => Math.max(max, r.dibuatPada || 0), 0)
        terakhirDilihatRef.current = maxWaktu
        simpanTerakhirDilihat(maxWaktu)
        return
      }
      terakhirDilihatRef.current = tersimpan
    }

    const adaYangBaru = riwayat.some((r) => (r.dibuatPada || 0) > terakhirDilihatRef.current)
    if (adaYangBaru && tabAktifRef.current !== 'riwayat') {
      setAdaRiwayatBaru(true)
    }
  }, [riwayat, riwayatSiap])

  function handleTabChange(tab) {
    setTabAktif(tab)
    if (tab === 'home') setAdaChatBaru(false)
    if (tab === 'riwayat') {
      setAdaRiwayatBaru(false)
      const maxWaktu = riwayat.reduce((max, r) => Math.max(max, r.dibuatPada || 0), Date.now())
      terakhirDilihatRef.current = maxWaktu
      simpanTerakhirDilihat(maxWaktu)
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
        {tabAktif === 'riwayat' && <RiwayatTab riwayat={riwayat} />}
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