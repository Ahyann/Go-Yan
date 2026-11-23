import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { getar, POLA_GETAR } from '../lib/getar'
import { playGoTutup } from '../lib/sound'

const LAMA_TAHAN = 600 // ms tombol harus ditahan sampai penuh

// Logout dengan ditahan: isi merah mengalir dari kiri selama ditahan (0,6 detik), dan baru keluar kalau sudah penuh. Dilepas
// sebelum penuh = batal (isi menyusut balik). Mencegah kepencet tak sengaja, apalagi di akun demo yang datanya direset
// saat logout.
export default function TombolLogout() {
  const { logout } = useAuth()
  const { t } = useLanguage()
  const [menahan, setMenahan] = useState(false)
  const timer = useRef(null)
  const tengah = useRef(null)
  const selesai = useRef(false)

  function bersihkan() {
    clearTimeout(timer.current)
    clearTimeout(tengah.current)
  }
  useEffect(() => bersihkan, [])

  function mulai() {
    if (selesai.current) return
    setMenahan(true)
    getar(8)
    tengah.current = setTimeout(() => getar(10), LAMA_TAHAN / 2)
    timer.current = setTimeout(() => {
      selesai.current = true
      getar(POLA_GETAR.kaget)
      playGoTutup()
      logout()
    }, LAMA_TAHAN)
  }

  function lepas() {
    bersihkan()
    setMenahan(false)
  }

  function tombolKeyboard(e) {
    if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    mulai()
  }

  return (
    <button
      type="button"
      style={s.tombol}
      onPointerDown={mulai}
      onPointerUp={lepas}
      onPointerLeave={lepas}
      onPointerCancel={lepas}
      onKeyDown={tombolKeyboard}
      onKeyUp={lepas}
      onBlur={lepas}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span
        aria-hidden="true"
        style={{ ...s.isi, transform: menahan ? 'scaleX(1)' : 'scaleX(0)', transition: menahan ? `transform ${LAMA_TAHAN}ms linear` : 'transform 0.2s ease-out' }}
      />
      <span style={s.teks}>{t.keluarTahan}</span>
    </button>
  )
}

const s = {
  tombol: {
    position: 'relative',
    overflow: 'hidden',
    background: 'transparent',
    border: '2px solid var(--web-red)',
    borderRadius: 0,
    color: '#FFFFFF',
    fontFamily: 'var(--font-data)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    padding: '15px 12px',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    touchAction: 'manipulation',
  },
  isi: { position: 'absolute', inset: 0, background: 'var(--web-red)', transformOrigin: 'left', transform: 'scaleX(0)' },
  teks: { position: 'relative' },
}
