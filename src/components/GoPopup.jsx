import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AKSI } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'
import TimeWheelPicker from './TimeWheelPicker.jsx'
import { playGoBuka, playGoTutup } from '../lib/sound'

const PRESET_LOKASI = ['Office']

export default function GoPopup({ onClose, onSubmit }) {
  const { t } = useLanguage()
  const { isDemo } = useAuth()
  useLockBodyScroll()
  useEffect(() => { playGoBuka() }, [])
  // Menutup dengan mengetuk di luar pop up. Mengirim GO punya bunyinya sendiri (pesan terkirim).
  // Animasinya (meluncur turun dan memudar, 0,24 detik) diputar dulu sebelum pop up benar-benar dilepas.
  const [menutup, setMenutup] = useState(false)
  const tutup = () => {
    if (menutup) return
    setMenutup(true)
    playGoTutup()
    setTimeout(onClose, 240)
  }
  const jamSekarang = new Date().toTimeString().slice(0, 2) + ':00'

  const [aksi, setAksi] = useState(AKSI.JEMPUT)
  const [where, setWhere] = useState('Office')
  const [waktu, setWaktu] = useState(jamSekarang)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef(null)

  function handleKirim() {
    const tujuanFinal = where.trim() || 'Office'
    onSubmit({ aksi, where: tujuanFinal, waktu })
  }

  function pilihPreset(nama) {
    setWhere(nama)
    setShowDropdown(false)
    inputRef.current?.blur()
  }

  return createPortal(
    <div className={menutup ? 'go-overlay-tutup' : 'go-overlay-buka'} style={s.overlay} onClick={tutup}>
      <div className={menutup ? 'go-sheet-tutup' : 'go-sheet-buka'} style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.toggleRow}>
          <button
            className={aksi === AKSI.JEMPUT ? 'tekan sudut-cyan' : 'tekan'}
            style={aksi === AKSI.JEMPUT ? s.toggleActive : s.toggle}
            onClick={() => setAksi(AKSI.JEMPUT)}
          >
            {t.jemput}
          </button>
          <button
            className={aksi === AKSI.ANTAR ? 'tekan sudut-cyan' : 'tekan'}
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
                if (where.trim() === '') setWhere('Office')
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

        <button className="tekan" style={s.kirim} onClick={handleKirim}>
          <span style={s.kirimTeks}>{isDemo ? t.kirimKeDriver : t.kirimKeAhyan}</span>
        </button>
      </div>
    </div>,
    document.body
  )
}

const MONO = 'var(--font-data)'

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    justifyContent: 'center',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
    padding: 'max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom))',
    zIndex: 9999,
  },
  sheet: {
    margin: 'auto',
    width: '100%',
    maxWidth: 400,
    boxSizing: 'border-box',
    background: 'var(--panel)',
    border: '1px solid rgba(96, 192, 240, 0.4)',
    borderRadius: 0,
    padding: '20px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  toggleRow: { display: 'flex', gap: 4, background: '#011A29', border: '1px solid rgba(96, 192, 240, 0.4)', padding: 4 },
  toggle: {
    flex: 1,
    height: 40,
    borderRadius: 0,
    backgroundColor: 'transparent',
    color: '#B0BAD6',
    opacity: 0.7,
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  toggleActive: {
    flex: 1,
    height: 40,
    borderRadius: 0,
    backgroundColor: 'rgba(94, 208, 255, 0.14)',
    color: 'var(--glow-blue)',
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#B0BAD6',
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
    color: 'var(--glow-blue)',
    borderRadius: 0,
  },
  dropdownList: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    background: '#011A29',
    border: '1px solid rgba(96, 192, 240, 0.4)',
    borderRadius: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '11px 14px',
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text)',
    background: 'transparent',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    height: 46,
    background: '#011A29',
    border: '1px solid rgba(96, 192, 240, 0.4)',
    borderRadius: 0,
    padding: '0 40px 0 14px',
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: 700,
    textTransform: 'none',
    letterSpacing: 'normal',
    color: 'var(--text)',
  },
  kirim: {
    height: 54,
    background: 'var(--nav-red)',
    borderRadius: 0,
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kirimTeks: {
    display: 'block',
    transform: 'skewX(-8deg)',
    fontFamily: 'var(--font-judul)',
    fontSize: 26,
    letterSpacing: '0.06em',
    color: '#fff',
    textTransform: 'uppercase',
  },
}
