import { useEffect, useRef, useState } from 'react'
import { useLokasiSaya } from '../lib/useLokasiSaya'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { playChatSound } from '../lib/sound'
import OjekNav from '../components/OjekNav.jsx'
import OjekHomeTab from './OjekHomeTab.jsx'
import OjekJadwalTab from './OjekJadwalTab.jsx'
import OjekRiwayatTab from './OjekRiwayatTab.jsx'
import OjekAccountTab from './OjekAccountTab.jsx'

const KEY_TERAKHIR_DILIHAT = 'go-yan-riwayat-terakhir-dilihat-ojek'

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

    const itemBaru = riwayat.find((r) => (r.dibuatPada || 0) > terakhirDilihatRef.current)
    if (itemBaru) {
      setIdRiwayatBaru(itemBaru.id)
      if (tabAktifRef.current !== 'riwayat') setAdaRiwayatBaru(true)
    }
  }, [riwayat, riwayatSiap])

  function handleTabChange(tab) {
    setTabAktif(tab)
    if (tab === 'home') setAdaChatBaru(false)
    if (tab === 'riwayat') {
      setAdaRiwayatBaru(false)
      setIdRiwayatBaru(null)
      const maxWaktu = riwayat.reduce((max, r) => Math.max(max, r.dibuatPada || 0), Date.now())
      terakhirDilihatRef.current = maxWaktu
      simpanTerakhirDilihat(maxWaktu)
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