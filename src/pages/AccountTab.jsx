import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { ROLE } from '../lib/constants'
import { mintaIzinDanSimpanToken, matikanNotifikasi, cekStatusNotifikasi } from '../lib/notifikasi'

export default function AccountTab() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const [status, setStatus] = useState('') // '', 'loading', 'ok', 'gagal'
  const [pesanError, setPesanError] = useState('')

  useEffect(() => {
    if (!user) return
    cekStatusNotifikasi(user.uid).then((aktif) => {
      if (aktif) setStatus('ok')
    })
  }, [user])

  async function handleAktifkanNotif() {
    setStatus('loading')
    setPesanError('')
    const hasil = await mintaIzinDanSimpanToken(user.uid, ROLE.PENUMPANG)
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
      // Gagal beneran hapus di server — JANGAN tampilin "mati" kalau
      // kenyataannya masih nyala di server, biar gak nipu diri sendiri.
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
          <div style={s.avatarWrap}>
            <img src="/icons/fajri.png" style={s.avatarImg} alt="" />
          </div>
          <div>
            <div style={s.label}>{t.masukSebagai}</div>
            <div style={s.email}>Wotkins</div>
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
    flexShrink: 0,
    width: 52,
    height: 52,
    borderRadius: '50%',
    overflow: 'hidden',
    background: 'rgba(94,208,255,0.12)',
    border: '2px solid var(--glow-blue-mid)',
    boxShadow: '0 0 8px rgba(94,208,255,0.4)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: '50% 20%',
    transform: 'scale(1.1) translateY(10px)',
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
}
