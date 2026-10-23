import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { mintaIzinDanSimpanToken, matikanNotifikasi, cekStatusNotifikasi } from '../lib/notifikasi'
import PilihBahasa from './PilihBahasa.jsx'

// Pojok kanan atas tab Akun: ikon lonceng notifikasi (ketuk buat nyalain atau
// matiin) dan pilihan bahasa. Dipakai akun Ahyan dan Fajri, `role` nentuin
// peran yang disimpan bareng token notifikasinya.
//
// Notifikasi mati: lonceng abu-abu dengan tanda silang merah.
// Notifikasi nyala: lonceng hijau bercahaya.
export default function PojokPengaturan({ role }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [status, setStatus] = useState('') // '', 'loading', 'ok', 'gagal'
  const [pesanError, setPesanError] = useState('')

  useEffect(() => {
    if (!user) return
    cekStatusNotifikasi(user.uid).then((aktif) => {
      if (aktif) setStatus('ok')
    })
  }, [user])

  async function handleAktifkan() {
    setStatus('loading')
    setPesanError('')
    const hasil = await mintaIzinDanSimpanToken(user.uid, role)
    if (hasil.berhasil) {
      setStatus('ok')
    } else {
      setStatus('gagal')
      setPesanError(hasil.alasan)
    }
  }

  async function handleMatikan() {
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

  const nyala = status === 'ok'
  const memproses = status === 'loading'

  return (
    <div style={s.pojok}>
      <div style={s.baris}>
        <button
          type="button"
          style={{ ...(nyala ? s.lonceng : s.loncengMati), ...(memproses ? s.memproses : null) }}
          onClick={nyala ? handleMatikan : handleAktifkan}
          disabled={memproses}
          aria-label={nyala ? t.notifAriaNyala : t.notifAriaMati}
          aria-pressed={nyala}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            {!nyala && <line x1="3" y1="3" x2="21" y2="21" stroke="var(--web-red)" strokeWidth="2.6" />}
          </svg>
        </button>
        <PilihBahasa />
      </div>
      {status === 'gagal' && pesanError && <div style={s.error}>{pesanError}</div>}
    </div>
  )
}

const dasar = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
}

const s = {
  pojok: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 24px)',
    right: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    zIndex: 2,
  },
  baris: { display: 'flex', alignItems: 'center', gap: 8 },
  loncengMati: {
    ...dasar,
    color: 'var(--text-dim)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
  },
  lonceng: {
    ...dasar,
    color: 'var(--signal)',
    background: 'rgba(74,222,128,0.14)',
    border: '1px solid var(--signal)',
    boxShadow: '0 0 8px rgba(74,222,128,0.45)',
  },
  memproses: { opacity: 0.55 },
  error: { maxWidth: 220, fontSize: 11, color: 'var(--web-red)', textAlign: 'right', lineHeight: 1.35 },
}
