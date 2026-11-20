import { useEffect, useRef, useState } from 'react'
import { useLokasiSaya } from '../lib/useLokasiSaya'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { playChatSound, playGantiBuka, playGantiBatal, playTabPindah } from '../lib/sound'
import { getar } from '../lib/getar'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useReminderKeberangkatan } from '../lib/useReminderKeberangkatan'
import { STATUS_PERMINTAAN } from '../lib/constants'
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
  const { t } = useLanguage()
  const [tabAktif, setTabAktif] = useState('home')
  const [menuBuka, setMenuBuka] = useState(false)
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

  function bukaTutupMenu() {
    getar(15)
    if (menuBuka) playGantiBatal()
    else playGantiBuka()
    setMenuBuka(!menuBuka)
  }

  function pilihDariMenu(tab) {
    getar(15)
    playTabPindah()
    setMenuBuka(false)
    handleTabChange(tab)
  }

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
      {/* Tombol menu (S3) di sudut kiri atas bingkai, menggantikan dock tab di bawah */}
      <button
        data-tanpa-suara
        className="tekan"
        style={{ ...s.tombolMenu, ...(menuBuka ? s.tombolMenuBuka : null) }}
        onClick={bukaTutupMenu}
        aria-label={menuBuka ? t.tutup ?? 'Close' : 'Menu'}
        aria-expanded={menuBuka}
      >
        {menuBuka ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#04192A" strokeWidth="4" strokeLinecap="square" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
        ) : (
          <span style={s.kisi} aria-hidden="true"><i style={s.kotakKisi} /><i style={s.kotakKisi} /><i style={s.kotakKisi} /><i style={s.kotakKisi} /></span>
        )}
        {!menuBuka && (adaChatBaru || adaRiwayatBaru || adaPermintaanBaru) && <span style={s.titikBaru} aria-hidden="true" />}
      </button>
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

      {menuBuka && (
        <div style={s.menuLatar} onClick={() => { playGantiBatal(); setMenuBuka(false) }}>
          <div aria-hidden="true" style={s.garisScan} />
          <div style={s.ubinWadah} onClick={(e) => e.stopPropagation()}>
            {[
              { id: 'home', label: t.navHome, badge: adaChatBaru || adaPermintaanBaru, ikon: <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" /> },
              { id: 'jadwal', label: t.navJadwal, badge: false, ikon: <><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /></> },
              { id: 'riwayat', label: t.navRiwayat, badge: adaRiwayatBaru, ikon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></> },
              { id: 'akun', label: t.navAkun, badge: false, ikon: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.5-4 5-5.5 7-5.5s5.5 1.5 7 5.5" /></> },
            ].map((u, i) => (
              <button
                key={u.id}
                data-tanpa-suara
                className="tekan kotak-pop"
                style={{ ...s.ubin, ...(tabAktif === u.id ? s.ubinAktif : null), '--i': i }}
                onClick={() => pilihDariMenu(u.id)}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden="true">{u.ikon}</svg>
                <span>{u.label}</span>
                {u.badge && <span style={s.titikBaru} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      )}
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
  tombolMenu: {
    position: 'absolute', left: 2, top: 'calc(var(--safe-top) + 2px)', zIndex: 2100,
    width: 40, height: 40, boxSizing: 'border-box', padding: 0,
    background: '#5ED0FF', border: '3px solid #04192A',
    boxShadow: 'inset 0 3px 0 #BFE9FF, inset 0 -3px 0 #2B83BC, 2px 2px 0 #04192A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tombolMenuBuka: { background: '#BFE9FF' },
  kisi: { display: 'grid', gridTemplateColumns: '7px 7px', gap: 3 },
  kotakKisi: { width: 7, height: 7, background: '#04192A', display: 'block' },
  titikBaru: { position: 'absolute', top: -4, right: -4, width: 10, height: 10, background: '#FF4C4C', boxShadow: '0 0 0 2px #04192A' },
  menuLatar: {
    position: 'absolute', zIndex: 2000,
    top: 'calc(var(--safe-top) + 8px)', left: 22, right: 22, bottom: 'calc(var(--safe-bottom) + 10px)',
    background: 'rgba(3, 18, 31, 0.96)',
    borderStyle: 'solid', borderWidth: 4, borderColor: '#1A5E8A #8FD8FF #8FD8FF #1A5E8A',
    padding: '56px 16px 0', boxSizing: 'border-box',
  },
  garisScan: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px 3px)',
  },
  ubinWadah: { position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  ubin: {
    position: 'relative', aspectRatio: '1', boxSizing: 'border-box', padding: 0, borderRadius: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
    background: '#03121F', border: '3px solid #5ED0FF', color: '#5ED0FF',
    fontFamily: "'Silkscreen', monospace", fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  ubinAktif: { background: '#BC1E2F', borderColor: '#FF6B78', color: '#fff' },
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