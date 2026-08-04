import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AKSI } from '../lib/constants'
import TimeWheelPicker from './TimeWheelPicker.jsx'

export default function GoPopup({ onClose, onSubmit }) {
  const jamSekarang = new Date().toTimeString().slice(0, 5)

  const [aksi, setAksi] = useState(AKSI.JEMPUT)
  const [where, setWhere] = useState('')
  const [waktu, setWaktu] = useState(jamSekarang)

  const bisaKirim = where.trim().length > 0

  function handleKirim() {
    if (!bisaKirim) return
    onSubmit({ aksi, where: where.trim(), waktu })
  }

  return createPortal(
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.toggleRow}>
          <button
            style={aksi === AKSI.JEMPUT ? s.toggleActive : s.toggle}
            onClick={() => setAksi(AKSI.JEMPUT)}
          >
            Jemput
          </button>
          <button
            style={aksi === AKSI.ANTAR ? s.toggleActive : s.toggle}
            onClick={() => setAksi(AKSI.ANTAR)}
          >
            Antar
          </button>
        </div>

        <label style={s.label}>
          Where
          <div style={s.presetRow}>
            <button
              type="button"
              style={where === 'Office' ? s.presetChipAktif : s.presetChip}
              onClick={() => setWhere('Office')}
            >
              Office
            </button>
          </div>
          <input
            style={s.input}
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            onBlur={() => {
              window.scrollTo(0, 0)
              setTimeout(() => window.scrollTo(0, 0), 300)
            }}
            placeholder="Contoh: Kampus, gerbang depan"
          />
        </label>

        <div style={s.label}>
          Time
          <TimeWheelPicker value={waktu} onChange={setWaktu} />
        </div>

        <button style={bisaKirim ? s.kirim : s.kirimDisabled} onClick={handleKirim}>
          Kirim ke Ahyan
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
  presetRow: { display: 'flex', gap: 8, marginTop: 2 },
  presetChip: {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    border: '1px solid var(--blue-border)',
  },
  presetChipAktif: {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 999,
    background: 'rgba(94,208,255,0.18)',
    color: 'var(--glow-blue)',
    border: '1px solid var(--glow-blue-mid)',
    textShadow: '0 0 4px var(--glow-blue-mid)',
  },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '12px 14px',
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