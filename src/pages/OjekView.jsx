import { useEffect, useRef, useState } from 'react'
import { useLokasiSaya } from '../lib/useLokasiSaya'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { playChatSound } from '../lib/sound'
import OjekNav from '../components/OjekNav.jsx'
import OjekHomeTab from './OjekHomeTab.jsx'
import OjekJadwalTab from './OjekJadwalTab.jsx'
import OjekRiwayatTab from './OjekRiwayatTab.jsx'
import OjekAccountTab from './OjekAccountTab.jsx'

const KEY_RIWAYAT_DILIHAT = 'go-yan-riwayat-dilihat-ojek'

function ambilIdDilihat() {
  try {
    const raw = localStorage.getItem(KEY_RIWAYAT_DILIHAT)
    if (raw === null) return null
    return new Set(JSON.parse(raw))
  } catch {
    return null
  }
}

function simpanIdDilihat(idsSet) {
  try {
    localStorage.setItem(KEY_RIWAYAT_DILIHAT, JSON.stringify([...idsSet]))
  } catch {
    // gapapa
  }
}

export default function OjekView({
  permintaan,
  riwayat,
  riwayatSiap,
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
  } = useLokasiSaya()

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

  const idsPernahDilihatRef = useRef(null)

  useEffect(() => {
    if (!riwayatSiap) return

    const idSekarang = new Set(riwayat.map((r) => r.id))

    if (idsPernahDilihatRef.current === null) {
      const dariStorage = ambilIdDilihat()
      if (dariStorage === null) {
        idsPernahDilihatRef.current = idSekarang
        simpanIdDilihat(idSekarang)
        return
      }
      idsPernahDilihatRef.current = dariStorage
    }

    const itemBenerBaru = riwayat.find((r) => !idsPernahDilihatRef.current.has(r.id))
    idsPernahDilihatRef.current = idSekarang
    simpanIdDilihat(idSekarang)

    if (itemBenerBaru) {
      setIdRiwayatBaru(itemBenerBaru.id)
      if (tabAktifRef.current !== 'riwayat') setAdaRiwayatBaru(true)
    }
  }, [riwayat, riwayatSiap])

  function handleTabChange(tab) {
    setTabAktif(tab)
    if (tab === 'home') setAdaChatBaru(false)
    if (tab === 'riwayat') {
      setAdaRiwayatBaru(false)
      setIdRiwayatBaru(null)
      const idSekarang = new Set(riwayat.map((r) => r.id))
      idsPernahDilihatRef.current = idSekarang
      simpanIdDilihat(idSekarang)
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