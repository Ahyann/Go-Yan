import { useEffect, useRef, useState } from 'react'
import { STATUS_PERMINTAAN } from '../lib/constants'
import { playPesanTerkirim, playBatalDipencet, playChatSound } from '../lib/sound'
import { useLokasiSayaPenumpang } from '../lib/useLokasiSayaPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import { useRiwayatChat } from '../lib/useRiwayatChat'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
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
  const [baruDibatalkan, setBaruDibatalkan] = useState(false)
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

  const { t } = useLanguage()
  const { isDemo } = useAuth()
  const { pesan: pesanMasuk, siap: pesanSiap } = usePesanOjek()
  // Catat pesan masuk ke riwayat chat walau sedang di tab lain (kotak chat di Home belum terpasang saat itu).
  useRiwayatChat(pesanMasuk, null)
  // Kapsul notifikasi di atas layar saat ada chat masuk ketika sedang di tab selain Home.
  const [notifChat, setNotifChat] = useState(null)
  useEffect(() => {
    if (!notifChat) return undefined
    const id = setTimeout(() => setNotifChat(null), 4500)
    return () => clearTimeout(id)
  }, [notifChat])
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
      if (tabAktifRef.current !== 'home') {
        setAdaChatBaru(true)
        setNotifChat({ id: pesanMasuk.dibuatPada, teks: pesanMasuk.suara ? t.chatSuara : pesanMasuk.foto ? t.chatFoto : pesanMasuk.teks })
      }
    }
  }, [pesanMasuk, pesanSiap])

  // Cuma buat nyalain/matiin badge titik merah di tab Riwayat — gak
  // ada lagi tag "New" di dalem card, biar lebih simpel.
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
      setNotifChat(null)
    }
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
      playBatalDipencet()
      onBatal()
      setBaruDibatalkan(true)
      setTimeout(() => setBaruDibatalkan(false), 9000) // 3,4 detik animasi Spiderman + sisanya untuk tulisan "dibatalkan"
    }
  }

  async function handleKirimGo({ aksi, where, waktu }) {
    playPesanTerkirim()
    // Popup langsung ditutup tanpa menunggu Firebase: saat app baru dibuka koneksinya masih dingin dan kiriman bisa
    // makan beberapa detik. Kalau gagal, popup dibuka lagi dengan pesan error.
    setShowGo(false)
    try {
      await kirimGo({ aksi, where, waktu })
    } catch (err) {
      setShowGo(true)
      console.error('Gagal kirim GO:', err)
      alert('Gagal kirim permintaan: ' + err.message)
    }
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
            baruDibatalkan={baruDibatalkan}
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

      {notifChat && tabAktif !== 'home' && (
        <button
          type="button"
          key={notifChat.id}
          className="notif-turun"
          style={s.notifChat}
          onClick={() => handleTabChange('home')}
          aria-live="polite"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true" style={{ flexShrink: 0, color: 'var(--glow-blue)' }}>
            <path d="M4 5h16v11H9l-5 4z" />
          </svg>
          <span style={s.notifTeks}>
            <b style={s.notifNama}>{isDemo ? 'Driver' : 'Ahyan'}</b>: {notifChat.teks}
          </span>
        </button>
      )}

      {showGo && <GoPopup onClose={() => setShowGo(false)} onSubmit={handleKirimGo} />}

      {notifSelesaiData && (
        <SelesaiPopup data={notifSelesaiData} onDismiss={onDismissNotifSelesai} />
      )}
    </>
  )
}

const s = {
  notifChat: {
    position: 'fixed',
    top: 'calc(var(--safe-top) + 10px)',
    left: '50%',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    maxWidth: 'min(86vw, 340px)',
    background: 'var(--panel)',
    border: '1px solid var(--glow-blue)',
    boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
    padding: '7px 11px',
    color: 'var(--text)',
    fontSize: 12.5,
    textAlign: 'left',
  },
  notifTeks: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  notifNama: { color: 'var(--merah-teks)' },
  stageMap: { height: 'var(--app-height, 100dvh)', overflow: 'hidden' },
  stageScroll: { minHeight: 'var(--app-height, 100dvh)', overflowY: 'auto' },
}
