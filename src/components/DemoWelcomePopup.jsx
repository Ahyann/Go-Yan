import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const KECEPATAN_KETIK_MS = 22

// Sekali per sesi demo (per akun anonim demo), disimpan di sessionStorage:
// pindah tab atau muat ulang gak munculin lagi, tapi sesi demo baru munculin lagi.
function kunciSesi(uid) {
  return `goyan-demo-selamat-datang-${uid}`
}

function sudahDitutup(uid) {
  try {
    return sessionStorage.getItem(kunciSesi(uid)) === '1'
  } catch {
    return false
  }
}

function IkonLabaLaba() {
  return (
    <svg
      className="spider-swing"
      width="54"
      height="54"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--glow-blue)"
      strokeWidth="1.6"
      strokeLinecap="round"
      style={{ display: 'block', filter: 'drop-shadow(0 0 6px var(--glow-blue-mid))' }}
      aria-hidden="true"
    >
      <circle cx="12" cy="10" r="3" />
      <circle cx="12" cy="15.5" r="4" />
      <path d="M9 8 L4 5 M9 9.5 L3 9.5 M9 11.5 L4 13.5 M9 13.5 L5 16.5" />
      <path d="M15 8 L20 5 M15 9.5 L21 9.5 M15 11.5 L20 13.5 M15 13.5 L19 16.5" />
    </svg>
  )
}

// Pop up sambutan di akun demo: penjelasan singkat cara nyobain demo, tulisannya
// muncul kayak diketik. Ketuk teksnya buat langsung nampilin semuanya.
export default function DemoWelcomePopup() {
  const { t } = useLanguage()
  const { isDemo, user } = useAuth()
  const uid = user?.uid
  const [terbuka, setTerbuka] = useState(() => Boolean(isDemo && uid && !sudahDitutup(uid)))
  const [jumlah, setJumlah] = useState(0)

  // Akun demo bisa baru kebaca setelah komponen dipasang.
  useEffect(() => {
    if (isDemo && uid && !sudahDitutup(uid)) setTerbuka(true)
  }, [isDemo, uid])

  const isi = t.demoSelamatDatangIsi

  useEffect(() => {
    if (!terbuka) return
    setJumlah(0)
    const id = setInterval(() => {
      setJumlah((n) => {
        if (n >= isi.length) {
          clearInterval(id)
          return n
        }
        return n + 1
      })
    }, KECEPATAN_KETIK_MS)
    return () => clearInterval(id)
  }, [terbuka, isi])

  function tutup() {
    try {
      sessionStorage.setItem(kunciSesi(uid), '1')
    } catch {
      // penyimpanan diblokir, popup cuma nutup sampai halaman dimuat ulang
    }
    setTerbuka(false)
  }

  if (!terbuka) return null

  const selesaiKetik = jumlah >= isi.length

  return createPortal(
    <div style={s.overlay} role="dialog" aria-modal="true" aria-label={t.demoSelamatDatangJudul}>
      <div style={s.kartu}>
        <div style={s.logo}>
          <IkonLabaLaba />
        </div>
        <h2 style={s.judul}>{t.demoSelamatDatangJudul}</h2>
        <div style={s.teks} onClick={() => setJumlah(isi.length)}>
          {isi.slice(0, jumlah)}
          {!selesaiKetik && <span className="typing-cursor">|</span>}
        </div>
        <button type="button" style={s.tombol} onClick={tutup}>
          {t.demoOke}
        </button>
      </div>
    </div>,
    document.body
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5,8,18,0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000001,
  },
  kartu: {
    width: '100%',
    maxWidth: 360,
    background: 'linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))',
    border: '1px solid var(--blue-border)',
    borderRadius: 16,
    padding: '22px 20px 20px',
    boxShadow: '0 0 24px rgba(43,158,232,0.35)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  logo: { height: 58, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' },
  judul: {
    fontFamily: 'var(--font-judul)',
    fontSize: 24,
    letterSpacing: '1px',
    lineHeight: 1.2,
    color: 'var(--glow-blue)',
    textShadow: '0 0 8px var(--glow-blue-mid)',
    textAlign: 'center',
  },
  teks: {
    minHeight: 150,
    width: '100%',
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--text)',
    textAlign: 'left',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  tombol: {
    marginTop: 4,
    width: '100%',
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    padding: '13px',
    borderRadius: 999,
  },
}
