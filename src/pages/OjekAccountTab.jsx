import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { ROLE } from '../lib/constants'
import { mintaIzinDanSimpanToken, matikanNotifikasi, cekStatusNotifikasi } from '../lib/notifikasi'
import { useProfilIkon } from '../lib/useProfilIkon'

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
            <img src={`/icons/${ikonAhyan}`} style={s.avatarImg} alt="" />
            <div style={s.avatarBadge}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
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
        <div style={s.overlay} onClick={() => setShowPilihIkon(false)}>
          <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.sheetTitle}>{t.gantiFoto}</div>
            <div style={s.gridIkon}>
              {PILIHAN_IKON.map((namaFile) => (
                <button
                  key={namaFile}
                  style={{
                    ...s.pilihanIkon,
                    ...(namaFile === ikonAhyan ? s.pilihanIkonAktif : {}),
                  }}
                  onClick={async () => {
                    await pilihIkonAhyan(namaFile)
                    setShowPilihIkon(false)
                  }}
                >
                  <img src={`/icons/${namaFile}`} style={s.pilihanIkonImg} alt="" />
                </button>
              ))}
            </div>
            <button style={s.tutupBtn} onClick={() => setShowPilihIkon(false)}>
              {t.batal}
            </button>
          </div>
        </div>
      )}
    </main>
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
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    imageRendering: 'pixelated',
    background: 'rgba(94,208,255,0.12)',
    border: '2px solid var(--glow-blue-mid)',
    boxShadow: '0 0 8px rgba(94,208,255,0.4)',
    boxSizing: 'border-box',
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
  gridIkon: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  pilihanIkon: {
    aspectRatio: '1 / 1',
    borderRadius: '50%',
    padding: 3,
    background: 'transparent',
    border: '2px solid transparent',
  },
  pilihanIkonAktif: {
    border: '2px solid var(--glow-blue)',
    boxShadow: '0 0 8px rgba(94,208,255,0.6)',
  },
  pilihanIkonImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  tutupBtn: {
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px',
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
}
