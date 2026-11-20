import { useEffect, useRef, useState } from 'react'
import { STATUS_PERMINTAAN, AKSI } from '../lib/constants'
import { playMisiDiterima, playPesananBatal } from '../lib/sound'
import { useLokasiPenumpang, hapusLokasiPenumpangSekarang } from '../lib/useLokasiPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import PetaLokasiPenumpang from '../components/PetaLokasiPenumpang.jsx'
import SplashLabaLaba from '../components/SplashLabaLaba.jsx'
import SpideyMenunggu from '../components/SpideyMenunggu.jsx'
import MissionSuccessPopup from '../components/MissionSuccessPopup.jsx'
import TombolFoto from '../components/TombolFoto.jsx'
import TombolSuara from '../components/TombolSuara.jsx'
import SwipeToFinish from '../components/SwipeToFinish.jsx'
import DemoWelcomePopup from '../components/DemoWelcomePopup.jsx'

export default function OjekHomeTab({
  permintaan,
  onTerima,
  onTolak,
  onSelesai,
  lokasiAktif,
  lokasiError,
  mulaiLokasi,
  berhentiLokasi,
}) {
  const { t } = useLanguage()
  const { user, isDemo } = useAuth()
  const adaPermintaanMasuk = permintaan?.status === STATUS_PERMINTAAN.MENUNGGU
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  const lokasiPenumpang = useLokasiPenumpang()
  const { kirimPesan, kirimFoto, kirimSuara, hapusPesan } = usePesanOjek()
  const [teksPesan, setTeksPesan] = useState('')
  const [showMissionSuccess, setShowMissionSuccess] = useState(false)

  // Layar pembuka abu-abu dilewati kalau halaman di-refresh saat ada misi yang menunggu jawaban.
  const [lewatiSplash] = useState(() => {
    try {
      const waktu = Number(localStorage.getItem('goyan:menunggu-ojek'))
      return waktu > 0 && Date.now() - waktu < 30 * 60 * 1000
    } catch { return false }
  })
  const pernahMenunggu = useRef(false)
  useEffect(() => {
    try {
      if (adaPermintaanMasuk) {
        pernahMenunggu.current = true
        localStorage.setItem('goyan:menunggu-ojek', String(Date.now()))
      } else if (permintaan || pernahMenunggu.current) {
        pernahMenunggu.current = false
        localStorage.removeItem('goyan:menunggu-ojek')
      }
    } catch { /* abaikan */ }
  }, [adaPermintaanMasuk, permintaan])

  // Kartu Spiderman yang sama dengan sisi penumpang. Perubahan status dideteksi saat render supaya kartunya
  // langsung berlanjut ke animasi "diterima" atau "dibatalkan" tanpa dipasang ulang.
  const [transisiDiterima, setTransisiDiterima] = useState(false)
  const [transisiBatal, setTransisiBatal] = useState(null) // 'tolak' | 'batal'
  const [susutBatal, setSusutBatal] = useState(false)
  const [statusLalu, setStatusLalu] = useState(permintaan?.status)
  const dibuatPadaRef = useRef(permintaan?.dibuatPada)
  if (permintaan?.dibuatPada) dibuatPadaRef.current = permintaan.dibuatPada
  if (statusLalu !== permintaan?.status) {
    setStatusLalu(permintaan?.status)
    if (statusLalu === STATUS_PERMINTAAN.MENUNGGU) {
      if (permintaan?.status === STATUS_PERMINTAAN.DITERIMA) setTransisiDiterima(true)
      else if (permintaan?.status === STATUS_PERMINTAAN.DITOLAK || !permintaan?.status) {
        setTransisiBatal(permintaan?.status === STATUS_PERMINTAAN.DITOLAK ? 'tolak' : 'batal')
        setSusutBatal(false)
      }
    }
  }
  useEffect(() => {
    if (!transisiDiterima) return undefined
    const id = setTimeout(() => setTransisiDiterima(false), 2500)
    return () => clearTimeout(id)
  }, [transisiDiterima])
  useEffect(() => {
    if (!transisiBatal) return undefined
    playPesananBatal()
    const mulaiSusut = setTimeout(() => setSusutBatal(true), 2600)
    const selesai = setTimeout(() => { setTransisiBatal(null); setSusutBatal(false) }, 3200)
    return () => { clearTimeout(mulaiSusut); clearTimeout(selesai) }
  }, [transisiBatal])
  const tampilSpidey = adaPermintaanMasuk || transisiDiterima || !!transisiBatal
  const teksSpidey = {
    menunggu: t.ojekSpMasuk,
    menungguSub: t.ojekSpMenungguSub,
    diterima: t.ojekSpDiterima,
    diterimaSub: t.ojekSpMenuju,
    batal: transisiBatal === 'tolak' ? t.ojekSpTolak : t.ojekSpBatal,
    batalSub: transisiBatal === 'tolak' ? t.ojekSpTolakSub : t.ojekSpBatalSub,
  }

  function handleKirimPesan() {
    if (!teksPesan.trim()) return
    Promise.resolve(kirimPesan(teksPesan)).catch((err) => {
      console.error('Gagal kirim pesan:', err)
      alert('Gagal kirim pesan: ' + err.message)
    })
    setTeksPesan('')
  }

  async function handleTerima() {
    playMisiDiterima()
    try {
      await onTerima()
    } catch (err) {
      console.error('Gagal terima permintaan:', err)
      alert('Gagal terima permintaan: ' + err.message)
    }
  }

  async function handleTolak() {
    try {
      await onTolak()
    } catch (err) {
      console.error('Gagal tolak permintaan:', err)
      alert('Gagal tolak permintaan: ' + err.message)
    }
  }

  function handleSelesai() {
    berhentiLokasi()
    hapusLokasiPenumpangSekarang(isDemo, user?.uid)
    hapusPesan()
    setShowMissionSuccess(true)
    onSelesai()
  }

  const teksKosongPeta = adaPermintaanMasuk || sedangJalan
    ? (isDemo ? t.passengerBelumShare : t.fajriBelumShare)
    : t.belumAdaPermintaan

  return (
    <>
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>{t.ojekEyebrow}</div>
        <h1 style={s.title}>{isDemo ? t.haloDemo : t.ojekHalo}</h1>
      </header>

      <section style={s.mainCard}>
        {/* Bingkai piksel tebal di atas tepi kartu peta (tidak menangkap sentuhan) */}
        <div aria-hidden="true" style={s.bingkai}>
          {['tl', 'tr', 'bl', 'br'].map((k) => <span key={k} style={{ ...s.sudut, ...s['sudut_' + k] }} />)}
        </div>
        <div style={s.mapArea}>
          <PetaLokasiPenumpang
            lokasi={lokasiPenumpang}
            teksKosong={teksKosongPeta}
            isiPenuh
            lokasiAktif={sedangJalan ? lokasiAktif : undefined}
            onToggleLokasi={sedangJalan ? (lokasiAktif ? berhentiLokasi : mulaiLokasi) : undefined}
          />
          {!lewatiSplash && <SplashLabaLaba ukuran={10} />}
          {tampilSpidey && (
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 14, right: 14, zIndex: 1100 }}>
              <SpideyMenunggu dibuatPada={dibuatPadaRef.current} diterima={transisiDiterima} dibatalkan={!!transisiBatal} menyusut={susutBatal} isDemo={isDemo} teks={teksSpidey} gayaTolak info={permintaan ? { aksi: permintaan.aksi === AKSI.JEMPUT ? t.jemput : t.antar, waktu: permintaan.waktu, where: permintaan.where } : null} />
            </div>
          )}
        </div>

        {adaPermintaanMasuk && (
          <div style={s.bawahCard}>
            <div style={s.misiBaruRow}>
              <div style={s.misiBaruLabel}>{isDemo ? t.misiBaruDemo : t.misiBaru}</div>
            </div>
            <div style={s.permintaanAksi}>
              {permintaan.aksi === AKSI.JEMPUT ? t.jemput : t.antar} · {permintaan.waktu}
            </div>
            <div style={s.permintaanWhere}>{permintaan.where}</div>
            <div style={s.tombolRow}>
              <button style={s.tolakBtn} onClick={handleTolak}>{t.batalMisi}</button>
              <button style={s.terimaBtn} onClick={handleTerima}>{t.mulaiMisi}</button>
            </div>
          </div>
        )}

        {sedangJalan && !transisiDiterima && (
          <div style={s.bawahCard}>
            <div style={s.pita}>
              <span>{t.misiBerjalan}</span>
              <span style={s.pitaJam}>{permintaan.waktu}</span>
            </div>
            <div style={s.jalanRow}>
              <span style={s.dotHijau} />
              {permintaan.aksi === AKSI.JEMPUT ? t.sedangMenjemput : t.sedangMengantar} {isDemo ? t.namaDemo : 'Fajri'} · {permintaan.where}
            </div>

            <div style={{ ...s.pesanRow, opacity: lokasiAktif || isDemo ? 1 : 0.5 }}>
              <TombolFoto onKirimFoto={kirimFoto} disabled={!lokasiAktif && !isDemo} />
              <TombolSuara onKirimSuara={kirimSuara} disabled={!lokasiAktif && !isDemo} />
              <input
                style={s.pesanInput}
                value={teksPesan}
                onChange={(e) => setTeksPesan(e.target.value)}
                placeholder={isDemo ? t.placeholderPesanBubbleDemo : t.placeholderPesanBubble}
                maxLength={24}
                disabled={!lokasiAktif && !isDemo}
              />
              <button style={s.pesanBtn} onClick={handleKirimPesan} disabled={!lokasiAktif && !isDemo}>{t.kirim}</button>
            </div>
            <div style={s.pesanHint}>
              {lokasiAktif || isDemo ? t.quickChatHint : t.pesanPerluLive}
            </div>

            {lokasiError && <div style={s.lokasiError}>{lokasiError}</div>}

            <SwipeToFinish label={`${t.selesai} →`} onConfirm={handleSelesai} />
          </div>
        )}
      </section>
    </main>

    <DemoWelcomePopup />

    {showMissionSuccess && (
      <MissionSuccessPopup onDismiss={() => setShowMissionSuccess(false)} />
    )}
    </>
  )
}

const s = {
  wrap: {
    height: '100%',
    padding: 'calc(var(--safe-top) + 24px) 20px 20px',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: { flexShrink: 0 },
  eyebrow: {
    fontSize: 11, letterSpacing: '0.12em', color: 'var(--glow-blue)', marginBottom: 4,
    textShadow: '0 0 6px var(--glow-blue-mid)',
    fontWeight: 700,
  },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 26,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
  },

  mainCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--panel)',
    borderRadius: 0,
    overflow: 'hidden',
    minHeight: 0,
    position: 'relative',
    padding: 16,
  },
  bingkai: {
    position: 'absolute',
    inset: 0,
    zIndex: 1050,
    pointerEvents: 'none',
    boxShadow: 'inset 0 0 0 3px #04192A, inset 0 6px 0 #9BDDFF, inset 0 0 0 10px #2E8FCC, inset 0 0 0 13px #4FB4F2, inset 0 0 0 16px #04192A',
  },
  sudut: { position: 'absolute', width: 6, height: 6, background: 'var(--bg, #023854)' },
  sudut_tl: { top: 0, left: 0 },
  sudut_tr: { top: 0, right: 0 },
  sudut_bl: { bottom: 0, left: 0 },
  sudut_br: { bottom: 0, right: 0 },
  mapArea: {
    flex: 1,
    position: 'relative',
    minHeight: 200,
  },
  bawahCard: {
    flexShrink: 0,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    borderTop: '1px solid var(--garis)',
  },

  permintaanLabel: { fontSize: 13, color: '#9FC3E8' },
  misiBaruRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  spiderDangle: {
    position: 'relative',
    width: 30,
    height: 30,
    flexShrink: 0,
  },
  webThread: {
    position: 'absolute',
    top: -18,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 1,
    height: 27,
    background: 'linear-gradient(to bottom, transparent, var(--glow-blue-mid))',
  },
  misiBaruLabel: {
    fontFamily: 'var(--font-judul)',
    fontSize: 15,
    letterSpacing: '1px',
    color: 'var(--glow-blue)',
    textShadow: '0 0 8px var(--glow-blue-mid)',
  },
  permintaanAksi: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 20,
    color: 'var(--warn)', textShadow: '0 0 6px rgba(251,191,36,0.5)',
  },
  permintaanWhere: { fontSize: 14, color: '#8FB4DC' },
  tombolRow: { display: 'flex', gap: 10 },
  tolakBtn: {
    flex: 1,
    background: 'transparent',
    color: 'var(--text)',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 0,
    border: '1px solid var(--garis)',
  },
  terimaBtn: {
    flex: 1,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 0,
  },

  // Pita merah selebar kartu, menempel di tepi atas panel (padding panel 16).
  pita: {
    margin: '-16px -16px 0',
    background: 'var(--nav-red)',
    color: '#fff',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
  },
  pitaJam: { fontFamily: 'var(--font-data)' },
  jalanRow: { display: 'flex', alignItems: 'center', fontSize: 14.5, fontWeight: 600, color: 'var(--text)' },
  dotHijau: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--signal)',
    display: 'inline-block', marginRight: 8,
  },
  pesanRow: { display: 'flex', gap: 8, position: 'relative' },
  pesanInput: {
    flex: 1,
    background: 'var(--bg)',
    border: '1px solid var(--garis)',
    borderRadius: 0,
    padding: '10px 12px',
    fontSize: 14,
    color: 'var(--text)',
  },
  pesanBtn: {
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 13.5,
    fontWeight: 600,
    padding: '10px 16px',
    borderRadius: 0,
  },
  pesanHint: {
    fontSize: 11.5,
    color: 'var(--text-dim)',
    textAlign: 'center',
    marginTop: -4,
  },
  lokasiError: { fontSize: 12, color: 'var(--web-red)', textAlign: 'center' },
  selesaiBtn: {
    background: 'var(--signal)',
    color: '#08130d',
    fontSize: 15,
    fontWeight: 700,
    padding: '13px',
    borderRadius: 0,
  },
}