import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import JamKonsol from '../components/JamKonsol.jsx'
import BarisStatusSiaga from '../components/BarisStatusSiaga.jsx'
import { STATUS_PERMINTAAN, AKSI } from '../lib/constants'
import { playMisiDiterima, playPesananBatal, playMissionSuccess, playWhooshMasuk, playTombolKamera, playTombolSuara } from '../lib/sound'
import { useLokasiPenumpang, hapusLokasiPenumpangSekarang } from '../lib/useLokasiPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import PetaLokasiPenumpang from '../components/PetaLokasiPenumpang.jsx'
import SplashLabaLaba from '../components/SplashLabaLaba.jsx'
import SpideyMenunggu from '../components/SpideyMenunggu.jsx'
import MissionSuccessPopup from '../components/MissionSuccessPopup.jsx'
import { useSesiFoto, FotoInput, FotoPeta, FotoKonsol, labelSesiFoto } from '../components/SesiFotoOjek.jsx'
import TombolSuara from '../components/TombolSuara.jsx'
import KartuMisiOjek from '../components/KartuMisiOjek.jsx'
import SwipeToFinish from '../components/SwipeToFinish.jsx'
import DemoWelcomePopup from '../components/DemoWelcomePopup.jsx'

export default function OjekHomeTab({ slotKonsol, putaranMasuk = 0,
  permintaan,
  onTerima,
  onTolak,
  onSelesai,
  misiSelesai,
  setMisiSelesai,
  onCatatRiwayat,
  lokasiAktif,
  lokasiError,
  mulaiLokasi,
  berhentiLokasi,
  totalTrip = null,
}) {
  const { t, lang } = useLanguage()
  const { user, isDemo } = useAuth()
  const [bawahKartu, setBawahKartu] = useState(0)
  const adaPermintaanMasuk = permintaan?.status === STATUS_PERMINTAAN.MENUNGGU
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  const lokasiPenumpang = useLokasiPenumpang()
  const { kirimPesan, kirimFoto, kirimSuara, hapusPesan } = usePesanOjek()
  // Sesi foto: peta berganti viewfinder dan layar konsol berganti tombol potret selama kamera dipakai
  const sesiFoto = useSesiFoto({ aktif: permintaan?.status === STATUS_PERMINTAAN.DITERIMA, onKirimFoto: kirimFoto })
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
  // Misi selesai: kartu Spiderman yang sama tampil lagi dalam mode hijau (MISSION COMPLETE), lalu menyusut dan hilang.
  // Info misi disimpan dulu karena permintaan langsung kosong setelah selesai.
  const [susutSelesai, setSusutSelesai] = useState(false)
  const [keluarSelesai, setKeluarSelesai] = useState(false)
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
  // Tombol OK di konsol: Spiderman ditarik naik keluar, lalu kartu menyusut dan hilang
  function tutupMisiSelesai() {
    if (keluarSelesai) return
    // Riwayat dicatat sekarang (setelah OK), bukan saat slide selesai
    Promise.resolve(onCatatRiwayat?.(misiSelesai)).catch((err) => console.error('Gagal mencatat riwayat:', err))
    setKeluarSelesai(true)
    playWhooshMasuk()
    setTimeout(() => setSusutSelesai(true), 800)
    setTimeout(() => { setMisiSelesai(null); setSusutSelesai(false); setKeluarSelesai(false) }, 1400)
  }
  const tampilSpidey = adaPermintaanMasuk || transisiDiterima || !!transisiBatal || !!misiSelesai
  const teksSpidey = {
    menunggu: t.ojekSpMasuk,
    menungguSub: t.ojekSpMenungguSub,
    diterima: t.ojekSpDiterima,
    diterimaSub: t.ojekSpMenuju,
    // Saat misi selesai hanya judul di atas; keterangan misi tampil di konsol bawah supaya tidak dobel
    selesai: t.ojekSpSelesai,
    batal: transisiBatal === 'tolak' ? t.ojekSpTolak : t.ojekSpBatal,
    batalSub: t.ojekSpSiaga,
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
    const info = permintaan ? { aksi: permintaan.aksi, waktu: permintaan.waktu, where: permintaan.where, mulai: Date.now() } : null
    if (info) setMisiSelesai(info)
    setSusutSelesai(false)
    setKeluarSelesai(false)
    playMissionSuccess()
    // Info riwayat (tanggal dan jam saat selesai) dikembalikan oleh onSelesai dan disimpan bersama misi yang menunggu OK
    Promise.resolve(onSelesai()).then((hasil) => {
      if (info && hasil) setMisiSelesai({ ...info, ...hasil })
    }).catch((err) => console.error('Gagal menyelesaikan misi:', err))
  }

  const teksKosongPeta = adaPermintaanMasuk || sedangJalan
    ? (isDemo ? t.passengerBelumShare : t.fajriBelumShare)
    : t.belumAdaPermintaan

  return (
    <>
    <main style={s.wrap}>
      <section style={s.mainCard}>
        <div style={s.mapArea}>
          <PetaLokasiPenumpang
            lokasi={lokasiPenumpang}
            teksKosong={teksKosongPeta}
            isiPenuh
            bawahTertutup={bawahKartu}
          />
          <div aria-hidden="true" style={s.garisDalamPeta} />
          {!lewatiSplash && <SplashLabaLaba ukuran={10} />}
          <FotoInput sesi={sesiFoto} />
          <FotoPeta sesi={sesiFoto} />
          {sedangJalan && lokasiAktif && <div className="live-masuk" style={s.toastLive}><span className="live-kedip" style={s.titikLive} />{t.liveLocationAktif}</div>}
          {sedangJalan && !transisiDiterima && (
            <KartuMisiOjek onBawah={setBawahKartu} permintaan={permintaan} lokasiAktif={lokasiAktif} mulaiLokasi={mulaiLokasi} berhentiLokasi={berhentiLokasi} />
          )}
          {tampilSpidey && (
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 14, right: 14, zIndex: 1100 }}>
              <SpideyMenunggu key={misiSelesai ? `selesai-${misiSelesai.mulai}` : `misi-${putaranMasuk}`} dibuatPada={misiSelesai ? misiSelesai.mulai : dibuatPadaRef.current} diterima={transisiDiterima} selesai={!!misiSelesai} keluar={keluarSelesai} dibatalkan={!!transisiBatal} menyusut={susutBatal || susutSelesai} isDemo={isDemo} teks={teksSpidey} gayaTolak kompak />
            </div>
          )}
        </div>

        {/* Bingkai bawah yang lebih lebar. Saat ada misi masuk, tombolnya ada di sini; selain itu berisi slot gelap kosong.
            Info misi (aksi, jam, tempat) sudah tampil di bawah Spiderman. */}
        {/* Isi layar konsol di bawah (milik OjekView): label keadaan, info misi, dan tombol terima/tolak.
            Dikirim lewat portal supaya konsol tetap satu dan tingginya tidak berubah. */}
        {slotKonsol && createPortal(
          <>
            <span className="label-konsol" style={{ ...s.labelMonitor, ...(sesiFoto.fase ? s.labelBiru : misiSelesai && !adaPermintaanMasuk ? s.labelHijau : adaPermintaanMasuk || transisiBatal ? s.labelMerah : s.labelBiru) }}>
              {sesiFoto.fase ? labelSesiFoto(sesiFoto.fase, lang) : misiSelesai && !adaPermintaanMasuk ? t.monitorSelesai : adaPermintaanMasuk ? t.monitorMisiBaru : transisiBatal ? (transisiBatal === 'tolak' ? t.monitorDitolak : t.monitorDibatalkan) : sedangJalan ? t.monitorBerjalan : t.monitorStatus}
            </span>
            {sesiFoto.fase ? (
              <FotoKonsol sesi={sesiFoto} />
            ) : adaPermintaanMasuk ? (
              <div key={permintaan.dibuatPada}>
                <div style={s.baris1}>{permintaan.aksi === AKSI.JEMPUT ? t.jemput : t.antar} · {permintaan.waktu} · {permintaan.where}</div>
                <div style={s.tombolMelayang}>
                  <button className="tekan" style={s.tolakBtn} onClick={handleTolak}>{t.batalMisi}</button>
                  <button className="tekan" style={s.terimaBtn} onClick={handleTerima}>{t.mulaiMisi}</button>
                </div>
              </div>
            ) : misiSelesai ? (
              <div key="selesai" className="glitch-masuk" style={{ animationDelay: '0.2s' }}>
                <div style={s.baris1}>{misiSelesai.aksi === AKSI.JEMPUT ? t.jemput : t.antar} · {misiSelesai.waktu} · {misiSelesai.where}</div>
                <div style={s.tombolMelayang}>
                  <span style={{ ...s.baris2, flex: 1, marginTop: 0, color: '#4ADE80', alignSelf: 'center' }}>✓ {t.monitorTercatat}</span>
                  <button className="tekan" style={{ ...s.terimaBtn, flex: 'none', padding: '0 22px' }} onClick={tutupMisiSelesai} disabled={keluarSelesai}>OK</button>
                </div>
              </div>
            ) : transisiBatal ? (
              <div style={{ ...s.baris1, color: '#FF8A94' }}>{transisiBatal === 'tolak' ? t.monitorDitolakInfo : t.monitorDibatalkanInfo}</div>
            ) : sedangJalan && permintaan ? (
              <>
                <div style={s.barisJalan}>
                  <span style={s.infoJalan}>
                    <span style={s.ikonInfo}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {permintaan.waktu}
                    </span>
                    <span style={{ ...s.ikonInfo, minWidth: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true" style={{ flexShrink: 0 }}>
                        <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      <span style={s.potong}>{permintaan.where}</span>
                    </span>
                  </span>
                  {/* Kamera, suara, dan LIVE dikelompokkan: bar rekaman suara hanya menutupi kelompok ini, info jam dan tempat tetap terlihat */}
                  <span style={s.grupAksi}>
                  <span className="ikon-konsol" style={s.ikonKonsol} onPointerDown={() => playTombolKamera()}>
                    <button type="button" style={s.tombolKamera} onClick={sesiFoto.mulai} aria-label={t.ariaKirimFoto}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </button>
                  </span>
                  <span className="ikon-konsol" style={s.ikonKonsol} onPointerDown={playTombolSuara}><TombolSuara onKirimSuara={kirimSuara} kecil /></span>
                  <button
                    className="tekan"
                    style={{ ...s.tombolLive, ...(lokasiAktif ? s.tombolLiveNyala : null) }}
                    onClick={lokasiAktif ? berhentiLokasi : mulaiLokasi}
                    aria-pressed={lokasiAktif}
                    aria-label={lokasiAktif ? t.ariaMatikanShare : t.ariaNyalakanShare}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true">
                      <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    LIVE
                  </button>
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <SwipeToFinish label={t.selesai} onConfirm={handleSelesai} tinggi={32} konsol />
                </div>
              </>
            ) : (
              <>
                <JamKonsol bergilir keterangan={t.monitorStandby} bawah={<BarisStatusSiaga totalTrip={totalTrip} lokasiAktif={lokasiAktif} />} />
              </>
            )}
          </>,
          slotKonsol,
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
  // Penanda "Live location active" di pojok kiri atas peta, sama seperti akun penumpang
  toastLive: { position: 'absolute', left: 12, top: 26, zIndex: 1100, display: 'flex', alignItems: 'center', gap: 5, background: 'var(--nav-red)', color: '#fff', fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', padding: '3px 7px', whiteSpace: 'nowrap', pointerEvents: 'none' },
  titikLive: { width: 5, height: 5, background: '#fff', flexShrink: 0 },
  wrap: {
    height: '100%',
    padding: 0,
    width: '100%',
    boxSizing: 'border-box',
    flex: 1,
    minHeight: 0,
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
    minHeight: 0,
    position: 'relative',
    // Bingkai biru kini milik seluruh layar (OjekView), kartu ini cukup memberi ruang untuk papan judul
    padding: '16px 0 0',
  },
  bingkaiBawah: { flexShrink: 0, padding: '12px 0 14px' },
  slotKosong: {
    // Layar serba guna di bawah peta: lebih tinggi supaya nanti bisa menampilkan info lain, sudut berundak
    margin: '0 16px',
    clipPath: 'polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)',
    height: 46,
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    background: '#2A2C2E',
    border: '3px solid #04192A',
    boxShadow: 'inset 0 5px 0 #3E4042, inset 0 -3px 0 #1E2022',
    fontFamily: "'Silkscreen', monospace",
    fontSize: 16,
    lineHeight: 1,
    letterSpacing: '0.08em',
    color: '#8FD8FF',
    textShadow: '0 0 6px rgba(94, 208, 255, 0.6)',
    paddingTop: 4,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    minHeight: 200,
    overflow: 'hidden',
    background: 'var(--panel)',
    // Peta menjorok ke dalam: tepi gelap di atas/kiri, terang di bawah/kanan (bevel piksel 3D)
    borderStyle: 'solid',
    // Warna dan pola dari referensi Spidey Tracker: sisi kiri-kanan biru sedang, atas-bawah biru tua dan sedikit lebih tebal
    borderWidth: '9px 6px',
    borderColor: '#164C7A #2976A0 #164C7A #2976A0',
  },
  // Garis gelap tipis di sisi dalam bevel, di atas peta (tidak menangkap sentuhan)
  // Tepi dalam peta: garis gelap tipis di semua sisi (seperti layar Spidey Tracker), tanpa bayangan jatuh
  garisDalamPeta: { position: 'absolute', inset: 0, zIndex: 1050, pointerEvents: 'none', boxShadow: 'inset 0 0 0 3px #1E1E14' },

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
  monitor: {
    position: 'relative',
    marginTop: 8,
    background: '#03121F',
    borderStyle: 'solid',
    borderWidth: 4,
    borderColor: '#1A5E8A #8FD8FF #8FD8FF #1A5E8A',
    boxShadow: 'inset 0 0 0 2px #04192A',
    padding: '16px 12px 10px',
    fontFamily: "'Silkscreen', monospace",
    color: '#5ED0FF',
    textShadow: '0 0 6px rgba(94, 208, 255, 0.55)',
    lineHeight: 1.2,
  },
  labelMonitor: {
    position: 'absolute', left: 10, top: -14, zIndex: 2,
    fontFamily: "'Silkscreen', monospace", fontSize: 10, letterSpacing: '0.06em',
    padding: '3px 7px 2px', border: '2px solid #04192A', textShadow: 'none',
  },
  labelBiru: { background: '#5ED0FF', color: '#04192A' },
  labelMerah: { background: '#BC1E2F', color: '#fff' },
  labelHijau: { background: '#4ADE80', color: '#04192A' },
  garisScan: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px 3px)',
  },
  // Kamera dan suara di konsol, dikecilkan dari 36px ke sekitar 24px supaya setinggi tombol LIVE
  tombolKamera: { flexShrink: 0, width: 24, padding: 0, borderRadius: 0, background: 'transparent', border: '1px solid var(--blue-border)', color: 'var(--glow-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ikonKonsol: { display: 'inline-flex', alignItems: 'stretch', height: 24, flexShrink: 0 },
  grupAksi: { position: 'relative', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 },
  barisJalan: { display: 'flex', alignItems: 'center', gap: 5, height: 24 },
  infoJalan: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' },
  ikonInfo: { display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 },
  potong: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tombolLive: { flexShrink: 0, height: 24, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 7px', fontFamily: "'Silkscreen', monospace", fontSize: 10, color: '#94DDF4', border: '2px solid #5C7F96', background: 'transparent' },
  tombolLiveNyala: { color: '#04192A', background: '#4ADE80', borderColor: '#4ADE80', textShadow: 'none' },
  baris1: { fontSize: 14, letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' },
  baris2: { fontSize: 11, letterSpacing: '0.06em', opacity: 0.75, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' },
  tombolMelayang: { display: 'flex', gap: 8, marginTop: 8, position: 'relative' },
  // Tombol bergaya layar monitor: tolak bergaris biru, mulai merah
  tolakBtn: {
    flex: 1,
    height: 32,
    background: 'transparent',
    color: '#5ED0FF',
    fontFamily: "'Silkscreen', monospace",
    fontSize: 12,
    letterSpacing: '0.06em',
    textShadow: '0 0 6px rgba(94, 208, 255, 0.55)',
    borderRadius: 0,
    border: '2px solid #5ED0FF',
  },
  terimaBtn: {
    flex: 1.3,
    height: 32,
    background: '#BC1E2F',
    color: '#fff',
    fontFamily: "'Silkscreen', monospace",
    fontSize: 12,
    letterSpacing: '0.06em',
    borderRadius: 0,
    border: '2px solid #FF6B78',
    boxShadow: 'inset 0 -3px 0 rgba(0, 0, 0, 0.3)',
  },

  dotHijau: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--signal)',
    flexShrink: 0,
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