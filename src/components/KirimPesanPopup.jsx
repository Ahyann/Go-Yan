import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function KirimPesanPopup({ onClose, onKirim }) {
  const { t } = useLanguage()
  const [teks, setTeks] = useState('')

  function handleKirim() {
    if (!teks.trim()) return
    onKirim(teks.trim())
    setTeks('')
    onClose()
  }

  return createPortal(
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.title}>{t.judulKirimPesan}</div>
        <input
          style={s.input}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          placeholder={t.placeholderKetik}
          maxLength={24}
          autoFocus
        />
        <button style={teks.trim() ? s.kirimBtn : s.kirimBtnDisabled} onClick={handleKirim}>
          {t.kirim}
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
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 999999,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--blue-border)',
    borderRadius: 16,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  title: { fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'center' },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 15,
    color: 'var(--text)',
  },
  kirimBtn: {
    background: 'var(--glow-blue-mid)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },
  kirimBtnDisabled: {
    background: 'rgba(255,255,255,0.06)',
    color: '#5C7CA0',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },
}
