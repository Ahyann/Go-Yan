import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { ROLE } from '../lib/constants'
import { mintaIzinDanSimpanToken, matikanNotifikasi, cekStatusNotifikasi } from '../lib/notifikasi'
import { useProfilIkon } from '../lib/useProfilIkon'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

// Daftar pilihan icon preset — nanti tinggal ganti/tambah nama file
// di sini kalau kamu udah punya gambar asli buat dipasang.
const PILIHAN_IKON = ['spidericon.png', 'preset_biru.png', 'preset_merah.png', 'preset_hijau.png']

export default function OjekAccountTab() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const [status, setStatus] = useState('')
  const [pesanError, setPesanError] = useState('')
  const { ikonAhyan, pilihIkonAhyan } = useProfilIkon()
  const [showPilihIkon, setShowPilihIkon] = useState(false)
  const [pilihanSementara, setPilihanSementara] = useState(ikonAhyan)

  useEffect(() => {
    // Reset pilihan sementara ke icon yang lagi aktif tiap kali
    // popup DIBUKA — biar gak "nyangkut" dari sesi buka-tutup
    // sebelumnya kalau user gak jadi ganti.
    if (showPilihIkon) setPilihanSementara(ikonAhyan)
  }, [showPilihIkon, ikonAhyan])

  useEffect(() => {
    if (!user) return
    cekStatusNotifikasi(user.uid).then((aktif) => {
      if (aktif) setStatus('ok')
    })
  }, [user])

  async function handleAktifkanNotif() {
    setStatus('loading')
    setPesanError('')
    const hasil = await mintaIzinDanSimpanToken(user.uid, ROLE.OJEK)
    if (hasil.berhasil) {
      setStatus('ok')
    } else {
      setStatus('gagal')
      setPesanError(hasil.alasan)
    }
  }

  async function handleMatikanNotif() {
    setStatus('loading')
    setPesanError('')
    const hasil = await matikanNotifikasi(user.uid)
    if (hasil.berhasil) {
      setStatus('')
    } else {
      setStatus('ok')
      setPesanError(hasil.alasan)
    }
  }

  function handleToggleNotif() {
    if (status === 'ok') {
      handleMatikanNotif()
    } else {
      handleAktifkanNotif()
    }
  }

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>{t.akunEyebrow}</div>
        <h1 style={s.title}>{t.akunTitle}</h1>
      </header>

      <section style={s.card}>
        <div style={s.profilRow}>
          <button style={s.avatarWrap} onClick={() => setShowPilihIkon(true)} aria-label={t.gantiFoto}>
            <div style={s.avatarLingkaran}>
              <img src={`/icons/${ikonAhyan}`} style={s.avatarImg} alt="" />
            </div>
            <div style={s.avatarBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
          </button>
          <div>
            <div style={s.label}>{t.masukSebagai}</div>
            <div style={s.email}>Ahyan</div>
          </div>
        </div>
      </section>

      <section style={s.card}>
        <div style={s.label}>{t.notifikasiLabel}</div>
        <div style={s.notifDesc}>{t.notifikasiDesc}</div>
        <button
          style={status === 'ok' ? s.notifBtnOk : s.notifBtn}
          onClick={handleToggleNotif}
          disabled={status === 'loading'}
        >
          {status === 'ok' ? t.notifikasiAktif : status === 'loading' ? t.memproses : t.aktifkanNotifikasi}
        </button>
        {status === 'gagal' && <div style={s.notifError}>{pesanError}</div>}
      </section>

      <section style={s.card}>
        <div style={s.label}>{t.bahasaLabel}</div>
        <div style={s.bahasaRow}>
          <button
            style={lang === 'id' ? s.bahasaBtnAktif : s.bahasaBtn}
            onClick={() => setLang('id')}
          >
            Indonesia
          </button>
          <button
            style={lang === 'en' ? s.bahasaBtnAktif : s.bahasaBtn}
            onClick={() => setLang('en')}
          >
            English
          </button>
        </div>
      </section>

      <button style={s.logoutBtn} onClick={logout}>
        {t.keluar}
      </button>

      {showPilihIkon && (
        <ModalPilihIkon
          ikonAhyan={ikonAhyan}
          pilihanSementara={pilihanSementara}
          setPilihanSementara={setPilihanSementara}
          onBatal={() => setShowPilihIkon(false)}
          onKonfirmasi={async () => {
            await pilihIkonAhyan(pilihanSementara)
            setShowPilihIkon(false)
          }}
          t={t}
        />
      )}
    </main>
  )
}

// Posisi icon aktif SELALU di tengah (fixed). Yang gerak itu "track"
// di dalemnya, digeser pake CSS transform + transition, jadi
// kelihatan kayak animasi slide masuk-keluar (bukan discroll manual
// sama jari, walau tetep bisa digeser jari juga lewat touch event).
// Komponen TERPISAH khusus buat popup ini — soalnya hook React (kayak
// useLockBodyScroll) gak boleh dipanggil kondisional. Dengan motong
// jadi komponen sendiri yang cuma di-render pas showPilihIkon true,
// hook-nya otomatis "aktif" pas komponen ini muncul dan "mati" (scroll
// balik normal) pas komponen ini ilang — pas persis kayak yang kita mau.
function ModalPilihIkon({ ikonAhyan, pilihanSementara, setPilihanSementara, onBatal, onKonfirmasi, t }) {
  useLockBodyScroll()

  return (
    <div style={s.overlay} onClick={onBatal}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.sheetTitle}>{t.gantiFoto}</div>
        <CarouselIkon
          pilihan={PILIHAN_IKON}
          ikonAktif={ikonAhyan}
          onHalamanChange={setPilihanSementara}
        />
        <div style={s.tombolRow}>
          <button style={s.cancelBtn} onClick={onBatal}>
            {t.batal}
          </button>
          <button style={s.gantiBtn} onClick={onKonfirmasi}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

function CarouselIkon({ pilihan, ikonAktif, onHalamanChange }) {
  const [halaman, setHalaman] = useState(() => {
    const idx = pilihan.indexOf(ikonAktif)
    return idx >= 0 ? idx : 0
  })
  const sentuhAwal = useRef(null)

  useEffect(() => {
    onHalamanChange?.(pilihan[halaman])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halaman])

  function geser(delta) {
    setHalaman((h) => Math.max(0, Math.min(h + delta, pilihan.length - 1)))
  }

  function handleTouchStart(e) {
    sentuhAwal.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (sentuhAwal.current === null) return
    const selisih = sentuhAwal.current - e.changedTouches[0].clientX
    if (selisih > 40) geser(1)
    else if (selisih < -40) geser(-1)
    sentuhAwal.current = null
  }

  return (
    <div style={s.carouselWrap}>
      <button
        style={{ ...s.arrowBtn, ...s.arrowKiri, ...(halaman === 0 ? s.arrowNonaktif : {}) }}
        onClick={() => geser(-1)}
        disabled={halaman === 0}
        aria-label="Sebelumnya"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div
        style={s.carouselViewport}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            ...s.carouselTrack,
            width: `${pilihan.length * 100}%`,
            transform: `translateX(-${halaman * (100 / pilihan.length)}%)`,
          }}
        >
          {pilihan.map((namaFile) => (
            <div key={namaFile} style={{ ...s.carouselSlot, width: `${100 / pilihan.length}%` }}>
              <div style={s.carouselIkonBtn}>
                <img src={`/icons/${namaFile}`} style={s.carouselIkonImg} alt="" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        style={{ ...s.arrowBtn, ...s.arrowKanan, ...(halaman === pilihan.length - 1 ? s.arrowNonaktif : {}) }}
        onClick={() => geser(1)}
        disabled={halaman === pilihan.length - 1}
        aria-label="Berikutnya"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}

const s = {
  wrap: {
    minHeight: '100%',
    padding: 'calc(var(--safe-top) + 24px) 20px 110px',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {},
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 24,
    color: 'var(--text)',
    letterSpacing: '1px',
  },
  card: {
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 12,
    padding: 18,
  },
  profilRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
    width: 52,
    height: 52,
    padding: 0,
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: 'var(--glow-blue-mid)',
    border: '2px solid var(--card-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLingkaran: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'rgba(94,208,255,0.12)',
    border: '2px solid var(--glow-blue-mid)',
    boxShadow: '0 0 8px rgba(94,208,255,0.4)',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    // 78% doang dari lingkarannya — sisanya keliatan warna
    // background biru di pinggir, jadi gambarnya keliatan "lebih
    // kecil"/ada jarak ke tepi, bukan mepet penuh ke pinggir lingkaran.
    width: '78%',
    height: '78%',
    borderRadius: '50%',
    objectFit: 'cover',
    imageRendering: 'pixelated',
  },
  label: { fontSize: 12.5, color: '#9FC3E8', marginBottom: 6 },
  email: { fontSize: 15, color: 'var(--text)', fontWeight: 600 },
  notifDesc: { fontSize: 13, color: '#8FB4DC', marginBottom: 14, lineHeight: 1.4 },
  notifBtn: {
    width: '100%',
    background: 'var(--glow-blue-mid)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },
  notifBtnOk: {
    width: '100%',
    background: 'rgba(74,222,128,0.15)',
    color: 'var(--signal)',
    fontSize: 14,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
    border: '1px solid var(--signal)',
  },
  notifError: { fontSize: 12, color: 'var(--web-red)', marginTop: 8, textAlign: 'center' },
  bahasaRow: { display: 'flex', gap: 10 },
  bahasaBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px',
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
  bahasaBtnAktif: {
    flex: 1,
    background: 'rgba(94,208,255,0.15)',
    color: 'var(--glow-blue)',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px',
    borderRadius: 999,
    border: '1px solid var(--glow-blue-mid)',
  },
  logoutBtn: {
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 999,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--blue-border)',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sheetTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text)', textAlign: 'center' },
  carouselWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  arrowBtn: {
    flexShrink: 0,
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid var(--blue-border)',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowKiri: { paddingRight: 1 },
  arrowKanan: { paddingLeft: 1 },
  arrowNonaktif: {
    opacity: 0.25,
  },
  carouselViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  carouselTrack: {
    display: 'flex',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
  },
  carouselSlot: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    padding: '10px 0',
    boxSizing: 'border-box',
  },
  carouselIkonBtn: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    padding: 0,
    background: 'transparent',
    display: 'block',
  },
  carouselIkonImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  tombolRow: {
    display: 'flex',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px',
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
  gantiBtn: {
    flex: 1,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px',
    borderRadius: 999,
  },
}
