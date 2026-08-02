import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AKSI } from '../lib/constants'

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
          <input
            style={s.input}
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Contoh: Kampus, gerbang depan"
            autoFocus
          />
        </label>

        <label style={s.label}>
          Time
          <input
            style={s.input}
            type="time"
            value={waktu}
            onChange={(e) => setWaktu(e.target.value)}
          />
        </label>

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
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  toggleRow: { display: 'flex', gap: 8 },
  toggle: {
    flex: 1,
    padding: '11px',
    borderRadius: 'var(--radius)',
    background: 'var(--surface-2)',
    color: 'var(--text-dim)',
    fontSize: 14.5,
    fontWeight: 600,
  },
  toggleActive: {
    flex: 1,
    padding: '11px',
    borderRadius: 'var(--radius)',
    background: 'var(--web-red)',
    color: '#fff',
    fontSize: 14.5,
    fontWeight: 600,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    color: 'var(--text-dim)',
  },
  input: {
    background: 'var(--surface-2)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '12px 14px',
    fontSize: 15,
    color: 'var(--text)',
  },
  kirim: {
    background: 'var(--web-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 999,
    marginTop: 6,
  },
  kirimDisabled: {
    background: 'var(--surface-2)',
    color: 'var(--text-dim)',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 999,
    marginTop: 6,
  },
}