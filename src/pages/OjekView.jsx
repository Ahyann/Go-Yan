import { useEffect, useRef, useState } from 'react'
import { useLokasiSaya } from '../lib/useLokasiSaya'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { playChatSound, playTabPindah, playKonsolAlarm, playKonsolMati, bunyikanSetelahSiap, siapkanSuaraMasuk } from '../lib/sound'
import { getar } from '../lib/getar'
import JamKonsol from '../components/JamKonsol.jsx'
import PesanBergilir from '../components/PesanBergilir.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useReminderKeberangkatan } from '../lib/useReminderKeberangkatan'
import { STATUS_PERMINTAAN } from '../lib/constants'
import PermintaanBaruToast from '../components/PermintaanBaruToast.jsx'
import PapanGoYan from '../components/PapanGoYan.jsx'
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
  const { t } = useLanguage()
  const [tabAktif, setTabAktif] = useState('home')
  const [slotKonsol, setSlotKonsol] = useState(null)
  const [alarmKonsol, setAlarmKonsol] = useState(false)
  const [putaranMasuk, setPutaranMasuk] = useState(0)
  const [tahanMasuk, setTahanMasuk] = useState(false) // Spiderman disembunyikan sebentar selagi suara disiapkan
  // Glitch berkala di layar konsol: sekali tiap 9-16 detik (acak), sekitar setengah detik
  const [glitchBerkala, setGlitchBerkala] = useState(false)
  useEffect(() => {
    let timer
    const jadwal = () => {
      timer = setTimeout(() => {
        setGlitchBerkala(true)
        timer = setTimeout(() => { setGlitchBerkala(false); jadwal() }, 500)
      }, 9000 + Math.random() * 7000)
    }
    jadwal()
    return () => clearTimeout(timer)
  }, [])
  const statusKonsolLaluRef = useRef(undefined)
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
  const alarmTertundaRef = useRef(false)
  const statusMenungguRef = useRef(false)
  statusMenungguRef.current = permintaan?.status === STATUS_PERMINTAAN.MENUNGGU

  const putarAlarmTertunda = () => {
    if (!alarmTertundaRef.current) return
    alarmTertundaRef.current = false
    if (!statusMenungguRef.current) return
    // Suara disiapkan dulu, baru alarm + Spiderman turun dimulai bersamaan
    setTahanMasuk(true)
    siapkanSuaraMasuk().then(() => {
      setTahanMasuk(false)
      if (!statusMenungguRef.current) return
      setAlarmKonsol(true)
      setPutaranMasuk((n) => n + 1) // Spiderman di Home turun lagi dari atas
      bunyikanSetelahSiap(playKonsolAlarm)
    })
  }

  useEffect(() => {
    const saatTampil = () => {
      if (document.hidden) return
      // Tiap app dibuka lagi selagi ada permintaan menunggu: alarm + Spiderman turun diputar ulang
      if (statusMenungguRef.current) alarmTertundaRef.current = true
      if (tabAktifRef.current === 'home') putarAlarmTertunda()
    }
    document.addEventListener('visibilitychange', saatTampil)
    return () => document.removeEventListener('visibilitychange', saatTampil)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (permintaan === undefined) return

    if (permintaanTerakhirRef.current === undefined) {
      permintaanTerakhirRef.current = permintaan?.dibuatPada ?? null
      // App baru dibuka dan permintaan sudah menunggu: alarm tetap diputar
      if (permintaan?.status === STATUS_PERMINTAAN.MENUNGGU) {
        alarmTertundaRef.current = true
        if (tabAktifRef.current === 'home' && !document.hidden) putarAlarmTertunda()
      }
      return
    }

    const permintaanBaru =
      permintaan?.status === STATUS_PERMINTAAN.MENUNGGU &&
      permintaan.dibuatPada !== permintaanTerakhirRef.current

    permintaanTerakhirRef.current = permintaan?.dibuatPada ?? null

    if (permintaanBaru) {
      // Alarm konsol (kedip merah + bunyi) hanya diputar saat ojek benar-benar melihat Home.
      // Kalau sedang di tab lain atau app di latar, ditunda sampai kembali ke Home / app dibuka lagi.
      if (tabAktifRef.current === 'home' && !document.hidden) {
        setAlarmKonsol(true)
        playKonsolAlarm()
      } else {
        alarmTertundaRef.current = true
      }
    }

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

  // Misi yang tadinya menunggu jawaban lalu ditolak atau dibatalkan (bukan diterima): konsol bergetar dan merah
  const statusPermintaan = permintaan?.status
  useEffect(() => {
    const lalu = statusKonsolLaluRef.current
    statusKonsolLaluRef.current = statusPermintaan
    if (lalu === STATUS_PERMINTAAN.MENUNGGU && statusPermintaan !== STATUS_PERMINTAAN.MENUNGGU && statusPermintaan !== STATUS_PERMINTAAN.DITERIMA) {
      playKonsolMati()
    }
  }, [statusPermintaan])

  useEffect(() => {
    if (!alarmKonsol) return undefined
    const id = setTimeout(() => setAlarmKonsol(false), 1700)
    return () => clearTimeout(id)
  }, [alarmKonsol])

  function pilihTab(tab) {
    if (tab === tabAktif) return
    getar(15)
    playTabPindah()
    handleTabChange(tab)
  }

  function handleTabChange(tab) {
    setTabAktif(tab)
    if (tab === 'home') {
      tabAktifRef.current = 'home'
      if (!document.hidden) putarAlarmTertunda()
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
      <PapanGoYan />
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
            slotKonsol={slotKonsol}
            putaranMasuk={putaranMasuk}
            tahanMasuk={tahanMasuk}
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

      {/* Konsol tetap di dasar layar: bagian atas untuk info (diisi Home lewat portal), bagian bawah
          baris tab halaman. Tingginya tetap di semua keadaan dan semua tab, jadi isi di atasnya tidak naik-turun. */}
      <div
        className={[alarmKonsol ? 'konsol-alarm' : '', permintaan?.status === STATUS_PERMINTAAN.MENUNGGU ? 'konsol-denyut' : ''].filter(Boolean).join(' ') || undefined}
        style={s.konsol}
      >
        <div aria-hidden="true" style={s.garisScan} />
        <div ref={setSlotKonsol} className={glitchBerkala ? 'glitch-berkala' : undefined} style={s.areaInfo}>
          {tabAktif !== 'home' && (
            <>
              <span className="label-konsol" style={s.labelStatus}>{t.monitorStatus}</span>
              <JamKonsol keterangan={permintaan?.status === STATUS_PERMINTAAN.MENUNGGU ? t.monitorMisiBaru : t.monitorStandby} bawah={<PesanBergilir teks={t.teksJalanOjek} />} />
            </>
          )}
        </div>
        <nav style={s.barisTab}>
          {[
            { id: 'home', label: t.navHome, badge: adaChatBaru || adaPermintaanBaru, ikon: <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" /> },
            { id: 'jadwal', label: t.navJadwal, badge: false, ikon: <><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /></> },
            { id: 'riwayat', label: t.navRiwayat, badge: adaRiwayatBaru, ikon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></> },
            { id: 'akun', label: t.navAkun, badge: false, ikon: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.5-4 5-5.5 7-5.5s5.5 1.5 7 5.5" /></> },
          ].map((u) => {
            const aktif = tabAktif === u.id
            return (
              <button
                key={u.id}
                data-tanpa-suara
                className="tekan"
                style={{ ...s.tab, ...(aktif ? s.tabAktif : null) }}
                onClick={() => pilihTab(u.id)}
                aria-current={aktif ? 'page' : undefined}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true">{u.ikon}</svg>
                <span>{u.label}</span>
                {u.badge && <span style={s.titikBaru} aria-hidden="true" />}
                {aktif && ['tl', 'tr', 'bl', 'br'].map((k) => <span key={k} aria-hidden="true" style={{ ...s.siku, ...s['siku_' + k] }} />)}
              </button>
            )
          })}
        </nav>
      </div>
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
    padding: 'calc(var(--safe-top) + 8px) 22px calc(var(--safe-bottom) + 10px)',
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
  konsol: {
    position: 'relative',
    flexShrink: 0,
    height: 136,
    boxSizing: 'border-box',
    marginTop: 18,
    display: 'flex',
    flexDirection: 'column',
    // Seluruh layar konsol abu-abu polos (tanpa gradasi), tekstur dari garis scan
    background: '#2F2F2F',
    borderStyle: 'solid',
    borderWidth: 4,
    borderColor: '#1A5E8A #8FD8FF #8FD8FF #1A5E8A',
    boxShadow: 'inset 0 0 0 2px #04192A',
    fontFamily: "'Silkscreen', monospace",
    color: '#94DDF4',
    textShadow: '0 0 6px rgba(148, 221, 244, 0.5)',
  },
  garisScan: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px 3px)',
  },
  areaInfo: { flex: 1, minHeight: 0, padding: '15px 12px 0', lineHeight: 1.2 },
  labelStatus: {
    position: 'absolute', left: 10, top: -14, zIndex: 2, fontSize: 10, letterSpacing: '0.06em',
    padding: '3px 7px 2px', border: '2px solid #04192A', textShadow: 'none', background: '#5ED0FF', color: '#04192A',
  },
  barisInfo: { fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  barisJalan: { fontSize: 11, letterSpacing: '0.06em', opacity: 0.75, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden' },
  barisTab: { position: 'relative', display: 'flex', height: 40, flexShrink: 0, borderTop: '2px solid #1E1E1E' },
  tab: {
    position: 'relative', flex: 1, minWidth: 0, padding: 0, border: 'none', borderRadius: 0, background: 'transparent',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
    color: 'inherit', fontFamily: "'Silkscreen', monospace", fontSize: 8, letterSpacing: '0.04em', textTransform: 'uppercase',
  },
  // Tab aktif seperti dock awal: latar biru tipis dengan siku cyan di empat sudut
  tabAktif: { background: 'rgba(94, 208, 255, 0.14)' },
  siku: { position: 'absolute', width: 8, height: 8, borderColor: '#5ED0FF', borderStyle: 'solid', borderWidth: 0 },
  siku_tl: { top: 3, left: 3, borderTopWidth: 2, borderLeftWidth: 2 },
  siku_tr: { top: 3, right: 3, borderTopWidth: 2, borderRightWidth: 2 },
  siku_bl: { bottom: 3, left: 3, borderBottomWidth: 2, borderLeftWidth: 2 },
  siku_br: { bottom: 3, right: 3, borderBottomWidth: 2, borderRightWidth: 2 },
  titikBaru: { position: 'absolute', top: 4, right: '22%', width: 7, height: 7, background: '#FF4C4C', boxShadow: '0 0 0 2px #04192A' },
  lampu: { position: 'absolute', top: 'calc(var(--safe-top) + 6px)', width: 8, height: 8, pointerEvents: 'none' },
  stageHome: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
  // Tab selain Home tampil seperti layar yang menjorok ke dalam bingkai. --safe-top dinolkan karena
  // jarak dari notch sudah diberi oleh bingkai.
  stageLayar: {
    flex: 1,
    minHeight: 0,
    // Sejajar dengan tepi atas peta di Home (jarak yang sama untuk papan GO-YAN)
    marginTop: 16,
    overflowY: 'auto',
    background: 'var(--bg, #023854)',
    borderStyle: 'solid',
    borderWidth: 4,
    borderColor: '#1A5E8A #8FD8FF #8FD8FF #1A5E8A',
    boxShadow: 'inset 0 0 0 2px #04192A',
    '--safe-top': '0px',
  },
}