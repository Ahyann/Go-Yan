import { useEffect, useRef, useState } from 'react'
import { STATUS_PERMINTAAN } from '../lib/constants'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import PetaStatus from '../components/PetaStatus.jsx'
import { useSesiFoto, FotoInput, FotoPeta, FotoKonsol } from '../components/SesiFotoOjek.jsx'
import TombolSuara from '../components/TombolSuara.jsx'
import DemoWelcomePopup from '../components/DemoWelcomePopup.jsx'
import SplashLabaLaba from '../components/SplashLabaLaba.jsx'

export default function HomeTab({ permintaan, lokasiAktif, lokasiError, mulaiLokasi, berhentiLokasi, baruDibatalkan }) {
  const { t } = useLanguage()
  const { isDemo } = useAuth()
  const { kirimPesan, kirimFoto, kirimSuara } = usePesanPenumpang()
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  // Sesi foto: lapisan kaca menutup Home dengan viewfinder, sama seperti akun ojek
  const sesiFoto = useSesiFoto({ aktif: sedangJalan, onKirimFoto: kirimFoto, suaraKeras: true })
  // Saat halaman dibuka dan permintaan masih menunggu driver, layar pembuka abu-abu dilewati.
  // Data permintaan datang dari Firebase setelah halaman terbuka, jadi statusnya diingat di localStorage.
  const [lewatiSplash] = useState(() => {
    try {
      const waktu = Number(localStorage.getItem('goyan:menunggu'))
      return waktu > 0 && Date.now() - waktu < 30 * 60 * 1000
    } catch { return false }
  })
  const statusMenunggu = permintaan?.status === STATUS_PERMINTAAN.MENUNGGU
  const pernahMenunggu = useRef(false)
  useEffect(() => {
    try {
      if (statusMenunggu) {
        pernahMenunggu.current = true
        localStorage.setItem('goyan:menunggu', String(Date.now()))
      } else if (permintaan || pernahMenunggu.current) {
        // diterima, dibatalkan, atau selesai: tanda dihapus supaya refresh berikutnya memakai layar pembuka lagi
        pernahMenunggu.current = false
        localStorage.removeItem('goyan:menunggu')
      }
    } catch { /* abaikan */ }
  }, [statusMenunggu, permintaan])
  const [sinyalLive, setSinyalLive] = useState(0)
  const [teksPesan, setTeksPesan] = useState('')
  const mapRef = useRef(null)

  function handleMulai() {
    setSinyalLive((n) => n + 1) // peta pindah ke karakter sendiri begitu lokasi pertama masuk
    mulaiLokasi()
  }

  function handleBerhenti() {
    berhentiLokasi()
  }

  const bisaPesan = lokasiAktif || isDemo
  const labelShare = lokasiAktif ? t.ariaMatikanShare : (isDemo ? t.ariaNyalakanShareDemo : t.ariaNyalakanShare)

  function handleKirim() {
    const teks = teksPesan.trim()
    if (!teks || !bisaPesan) return
    Promise.resolve(kirimPesan(teks)).catch((err) => {
      console.error('Gagal kirim pesan:', err)
    })
    setTeksPesan('')
  }

  // Isi kartu status saat dibuka: share lokasi, kolom ketik, foto, dan kirim.
  const isiKartu = sesiFoto.fase ? (
    // Selama sesi foto, baris pesan di kartu berganti jadi tombol potret (batal, shutter, balik kamera) dengan efek layar menyala
    <div style={{ fontFamily: "'Silkscreen', monospace" }}>
      <FotoKonsol sesi={sesiFoto} />
    </div>
  ) : (
    <>
      <div style={s.pesanRow}>
        <button
          className="tekan"
          style={lokasiAktif ? s.shareAktif : s.share}
          onClick={lokasiAktif ? handleBerhenti : handleMulai}
          aria-label={labelShare}
          aria-pressed={lokasiAktif}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
            <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </button>
        <input
          className="input-pesan"
          style={{ ...s.pesanInput, opacity: bisaPesan ? 1 : 0.5 }}
          value={teksPesan}
          onChange={(e) => setTeksPesan(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleKirim() }}
          placeholder={t.placeholderKetik}
          aria-label={t.tombolKirimPesan}
          maxLength={24}
          disabled={!bisaPesan}
        />
        <button type="button" className="tekan" style={{ ...s.tombolKamera, opacity: bisaPesan ? 1 : 0.5 }} onClick={sesiFoto.mulai} disabled={!bisaPesan} aria-label={t.ariaKirimFoto}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        <TombolSuara onKirimSuara={kirimSuara} disabled={!bisaPesan} />
        <button
          className="tekan"
          style={{ ...s.kirimBtn, opacity: bisaPesan && teksPesan.trim() ? 1 : 0.5 }}
          onClick={handleKirim}
          disabled={!bisaPesan || !teksPesan.trim()}
          aria-label={t.kirim}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      {!bisaPesan && <div style={s.hint}>{t.pesanPerluLive}</div>}
    </>
  )

  return (
    <div style={s.wrap} data-suara-keras>
      <div style={s.headerFloat}>
        <div className="naik-masuk" style={s.salamWrap}>
          <div style={s.eyebrow}>{t.penumpangEyebrow}</div>
          <h1 style={s.salam}>{isDemo ? t.haloDemo : t.penumpangHalo}</h1>
        </div>
      </div>

      {sedangJalan && lokasiAktif && <div className="live-masuk" style={s.toastLive}><span className="live-kedip" style={s.titikLive} />{t.liveLocationAktif}</div>}
      {sedangJalan && lokasiError && <div style={s.toastError}>{lokasiError}</div>}

      <PetaStatus
        permintaan={permintaan}
        mapRef={mapRef}
        baruDibatalkan={baruDibatalkan}
        sinyalLive={sinyalLive}
        isiKartu={isiKartu}
        sembunyiChat={!!sesiFoto.fase}
      />

      <FotoInput sesi={sesiFoto} />
      <FotoPeta sesi={sesiFoto} mandiri />

      {!lewatiSplash && <SplashLabaLaba />}

      <DemoWelcomePopup />
    </div>
  )
}

const kotak44 = {
  width: 36,
  height: 36,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const s = {
  wrap: {
    position: 'relative',
    height: '100%',
    maxWidth: 480,
    margin: '0 auto',
    overflow: 'hidden',
  },
  headerFloat: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 14px)',
    left: 14,
    right: 14,
    zIndex: 1100,
    pointerEvents: 'none',
  },
  salamWrap: { paddingLeft: 6 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: '0.12em',
    color: 'var(--glow-blue)',
    marginBottom: 4,
    textShadow: '0 0 6px var(--glow-blue-mid), 0 1px 4px rgba(0,0,0,0.8)',
    fontWeight: 700,
  },
  salam: {
    fontFamily: 'var(--font-judul)',
    fontWeight: 400,
    fontSize: 26,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.2,
    textShadow: '0 1px 6px rgba(0,0,0,0.8)',
    whiteSpace: 'nowrap',
  },
  toastLive: {
    position: 'absolute',
    left: 20,
    zIndex: 1100,
    top: 'calc(var(--safe-top) + 72px)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--nav-red)',
    color: '#fff',
    fontFamily: 'var(--font-data)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '4px 8px',
    pointerEvents: 'none',
  },
  titikLive: { width: 6, height: 6, background: '#fff', flexShrink: 0 },
  toastError: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 76px)',
    left: 20,
    maxWidth: 220,
    zIndex: 1100,
    background: 'var(--panel)',
    color: 'var(--merah-teks)',
    fontSize: 12,
    padding: '8px 12px',
  },
  pesanRow: { display: 'flex', gap: 6, position: 'relative' },
  tombolKamera: { ...kotak44, color: 'var(--glow-blue)', border: '1px solid var(--blue-border)', background: 'transparent' },
  share: { ...kotak44, color: 'var(--glow-blue)', border: '1px solid var(--blue-border)' },
  shareAktif: { ...kotak44, color: '#fff', background: 'var(--nav-red)' },
  pesanInput: {
    flex: 1,
    minWidth: 0,
    height: 36,
    boxSizing: 'border-box',
    background: 'var(--bg)',
    border: '1px solid var(--blue-border)',
    borderRadius: 0,
    padding: '0 12px',
    fontSize: 16, // di bawah 16px iOS nge-zoom halaman saat kolom difokus
    color: 'var(--text)',
  },
  kirimBtn: { ...kotak44, color: '#fff', background: 'var(--nav-red)' },
  hint: { fontSize: 11.5, color: 'var(--text-dim)', textAlign: 'center' },
}
