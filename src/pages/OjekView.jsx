import { useEffect, useRef, useState } from 'react'
import { useLokasiSaya } from '../lib/useLokasiSaya'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { playChatSound } from '../lib/sound'
import { useReminderKeberangkatan } from '../lib/useReminderKeberangkatan'
import { STATUS_PERMINTAAN } from '../lib/constants'
import OjekNav from '../components/OjekNav.jsx'
import PermintaanBaruToast from '../components/PermintaanBaruToast.jsx'
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
  onTandaiSelesaiJadwal,
  simpanJadwal,
  onTerima,
  onTolak,
  onSelesai,
  onTandaiLunas,
  onHapusRiwayat,
  onEditRiwayat,
}) {
  const [tabAktif, setTabAktif] = useState('home')
  const [adaChatBaru, setAdaChatBaru] = useState(false)
  const [adaRiwayatBaru, setAdaRiwayatBaru] = useState(false)
  const [adaPermintaanBaru, setAdaPermintaanBaru] = useState(false)
  const [toastPermintaan, setToastPermintaan] = useState(null)
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

  useReminderKeberangkatan(permintaan)

  const permintaanTerakhirRef = useRef(undefined)

  useEffect(() => {
    if (permintaan === undefined) return

    if (permintaanTerakhirRef.current === undefined) {
      permintaanTerakhirRef.current = permintaan?.dibuatPada ?? null
      return
    }

    const permintaanBaru =
      permintaan?.status === STATUS_PERMINTAAN.MENUNGGU &&
      permintaan.dibuatPada !== permintaanTerakhirRef.current

    permintaanTerakhirRef.current = permintaan?.dibuatPada ?? null

    if (permintaanBaru && tabAktifRef.current !== 'home') {
      setAdaPermintaanBaru(true)
      setToastPermintaan(permintaan)
    }
  }, [permintaan])

  const { pesan: pesanMasuk, siap: pesanSiap } = usePesanPenumpang()
  const pesanTerakhirRef = useRef(undefined)

  useEffect(() => {
    if (!pesanSiap) return

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
  }, [pesanMasuk, pesanSiap])

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
    if (tab === 'home') {
      setAdaChatBaru(false)
      setAdaPermintaanBaru(false)
    }
    if (tab === 'riwayat') {
      setAdaRiwayatBaru(false)
      const maxWaktu = riwayat.reduce((max, r) => Math.max(max, r.dibuatPada || 0), Date.now())
      terakhirDilihatRef.current = maxWaktu
      simpanTerakhirDilihat(maxWaktu)
    }
  }

  return (
    <div style={s.appWrap}>
      {/* Hiasan bingkai: garis penggaris di sisi kiri-kanan dan dua lampu di sudut atas */}
      <div aria-hidden="true" style={{ ...s.penggarisKecil, left: 6 }} />
      <div aria-hidden="true" style={{ ...s.penggarisBesar, left: 6 }} />
      <div aria-hidden="true" style={{ ...s.penggarisKecil, right: 6 }} />
      <div aria-hidden="true" style={{ ...s.penggarisBesar, right: 6 }} />
      <span aria-hidden="true" className="kedip-piksel" style={{ ...s.lampu, left: 7, background: '#3DDC84', boxShadow: '0 0 6px #3DDC84, 0 0 0 1px #04192A' }} />
      <span aria-hidden="true" style={{ ...s.lampu, right: 7, background: '#FF4C4C', boxShadow: '0 0 0 1px #04192A' }} />
      <div style={tabAktif === 'home' ? s.stageHome : s.stageLayar}>
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
        {tabAktif === 'jadwal' && (
          <OjekJadwalTab
            jadwalMingguan={jadwalMingguan}
            onTandaiSelesai={onTandaiSelesaiJadwal}
            simpanJadwal={simpanJadwal}
          />
        )}
        {tabAktif === 'riwayat' && (
          <OjekRiwayatTab
            riwayat={riwayat}
            onTandaiLunas={onTandaiLunas}
            onHapusRiwayat={onHapusRiwayat}
            onEditRiwayat={onEditRiwayat}
          />
        )}
        {tabAktif === 'akun' && <OjekAccountTab />}
      </div>

      {toastPermintaan && (
        <PermintaanBaruToast
          permintaan={toastPermintaan}
          onTap={() => {
            setToastPermintaan(null)
            handleTabChange('home')
          }}
          onDismiss={() => setToastPermintaan(null)}
        />
      )}

      <OjekNav
        tabAktif={tabAktif}
        onTabChange={handleTabChange}
        adaChatBaru={adaChatBaru}
        adaRiwayatBaru={adaRiwayatBaru}
        adaPermintaanBaru={adaPermintaanBaru}
      />
    </div>
  )
}

const s = {
  // Bingkai biru piksel menyelimuti seluruh layar sampai tepi, termasuk dock tab di bawah.
  // Tepi terang di atas/kiri dan gelap di bawah/kanan supaya bingkai terlihat timbul.
  appWrap: {
    display: 'flex',
    flexDirection: 'column',
    height: 'var(--app-height, 100dvh)',
    boxSizing: 'border-box',
    position: 'relative',
    padding: 'calc(var(--safe-top) + 8px) 22px 0',
    background: '#3B9BD6',
    boxShadow: 'inset 0 4px 0 #8FD8FF, inset 4px 0 0 #6FC3EE, inset -4px 0 0 #2B83BC, inset 0 -4px 0 #1F6FA0',
  },
  penggarisKecil: {
    position: 'absolute', top: 'calc(var(--safe-top) + 40px)', bottom: 120, width: 5, pointerEvents: 'none',
    background: 'repeating-linear-gradient(to bottom, #1A5E8A 0 2px, transparent 2px 14px)',
  },
  penggarisBesar: {
    position: 'absolute', top: 'calc(var(--safe-top) + 40px)', bottom: 120, width: 9, pointerEvents: 'none',
    background: 'repeating-linear-gradient(to bottom, #1A5E8A 0 2px, transparent 2px 70px)',
  },
  lampu: { position: 'absolute', top: 'calc(var(--safe-top) + 6px)', width: 8, height: 8, pointerEvents: 'none' },
  stageHome: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
  // Tab selain Home tampil seperti layar yang menjorok ke dalam bingkai. --safe-top dinolkan karena
  // jarak dari notch sudah diberi oleh bingkai.
  stageLayar: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    background: 'var(--bg, #023854)',
    borderStyle: 'solid',
    borderWidth: 4,
    borderColor: '#1A5E8A #8FD8FF #8FD8FF #1A5E8A',
    boxShadow: 'inset 0 0 0 2px #04192A',
    '--safe-top': '0px',
  },
}