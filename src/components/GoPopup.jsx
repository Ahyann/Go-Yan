import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AKSI } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import TimeWheelPicker from './TimeWheelPicker.jsx'

const PRESET_LOKASI = ['Office']

export default function GoPopup({ onClose, onSubmit }) {
  const { t } = useLanguage()
  const jamSekarang = new Date().toTimeString().slice(0, 2) + ':00'

  const [aksi, setAksi] = useState(AKSI.JEMPUT)
  const [where, setWhere] = useState('Office')
  const [waktu, setWaktu] = useState(jamSekarang)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef(null)

  const bisaKirim = where.trim().length > 0

  function handleKirim() {
    if (!bisaKirim) return
    onSubmit({ aksi, where: where.trim(), waktu })
  }

  function pilihPreset(nama) {
    setWhere(nama)
    setShowDropdown(false)
    inputRef.current?.blur()
  }

  return createPortal(
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.toggleRow}>
          <button
            style={aksi === AKSI.JEMPUT ? s.toggleActive : s.toggle}
            onClick={() => setAksi(AKSI.JEMPUT)}
          >
            {t.jemput}
          </button>
          <button
            style={aksi === AKSI.ANTAR ? s.toggleActive : s.toggle}
            onClick={() => setAksi(AKSI.ANTAR)}
          >
            {t.antar}
          </button>
        </div>

        <div style={s.label}>
          <label htmlFor="where-input">{t.labelTujuan}</label>
          <div style={s.inputWrap}>
            <input
              id="where-input"
              ref={inputRef}
              style={s.input}
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              onFocus={() => {
                if (where === 'Office') setWhere('')
              }}
              onBlur={() => {
                window.scrollTo(0, 0)
                setTimeout(() => window.scrollTo(0, 0), 300)
              }}
              placeholder=""
            />
            <button
              type="button"
              style={s.dropdownBtn}
              onClick={() => setShowDropdown((v) => !v)}
              aria-label={t.ariaLokasiTersimpan}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showDropdown && (
              <div style={s.dropdownList}>
                {PRESET_LOKASI.map((nama) => (
                  <button
                    key={nama}
                    type="button"
                    style={s.dropdownItem}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pilihPreset(nama)}
                  >
                    {nama}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={s.label}>
          {t.labelWaktu}
          <TimeWheelPicker value={waktu} onChange={setWaktu} />
        </div>

        <button style={bisaKirim ? s.kirim : s.kirimDisabled} onClick={handleKirim}>
          {t.kirimKeAhyan}
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
    zIndex: 9999,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--blue-border)',
    borderRadius: 16,
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  toggleRow: { display: 'flex', gap: 8 },
  toggle: {
    flex: 1,
    padding: '11px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    fontSize: 14.5,
    fontWeight: 600,
    border: '1px solid var(--blue-border)',
  },
  toggleActive: {
    flex: 1,
    padding: '11px',
    borderRadius: 999,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 14.5,
    fontWeight: 600,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    color: '#9FC3E8',
  },
  inputWrap: { position: 'relative' },
  dropdownBtn: {
    position: 'absolute',
    right: 6,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8FB4DC',
    borderRadius: 8,
  },
  dropdownList: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 10,
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '11px 14px',
    fontSize: 14,
    color: 'var(--text)',
    background: 'transparent',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '12px 40px 12px 14px',
    fontSize: 15,
    color: 'var(--text)',
  },
  kirim: {
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 999,
    marginTop: 6,
  },
  kirimDisabled: {
    background: 'rgba(255,255,255,0.06)',
    color: '#5C7CA0',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 999,
    marginTop: 6,
  },
}
