import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { HARI_KERJA } from '../lib/constants'
import TimeWheelPicker from './TimeWheelPicker.jsx'

export default function JadwalMingguan({ jadwal, onSimpan, bisaEdit }) {
  const [draft, setDraft] = useState(jadwal)
  const [menyimpan, setMenyimpan] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    setDraft(jadwal)
  }, [jadwal])

  if (!draft) return null

  function ubahJam(hari, aksi, jam) {
    setDraft((d) => ({ ...d, [hari]: { ...d[hari], [aksi]: jam } }))
  }

  async function handleSimpan() {
    setMenyimpan(true)
    await onSimpan(draft)
    setMenyimpan(false)
    setTersimpan(true)
    setTimeout(() => setTersimpan(false), 2000)
  }

  const nilaiEditing = editing ? (draft[editing.hari]?.[editing.aksi] || '07:00') : '07:00'
  const labelHariEditing = editing ? HARI_KERJA.find((h) => h.key === editing.hari)?.label : ''

  return (
    <div style={s.wrap}>
      {HARI_KERJA.map(({ key, label }) => (
        <div key={key} style={s.hariBlok}>
          <div style={s.hariLabel}>{label}</div>

          <div style={s.aksiRow}>
            <span style={s.aksiLabel}>Antar</span>
            {bisaEdit ? (
              <button style={s.jamBtn} onClick={() => setEditing({ hari: key, aksi: 'antar' })}>
                {draft[key]?.antar || 'Atur jam'}
              </button>
            ) : (
              <span style={draft[key]?.antar ? s.jamBaca : s.jamKosong}>
                {draft[key]?.antar || 'Belum diisi'}
              </span>
            )}
          </div>

          <div style={s.aksiRow}>
            <span style={s.aksiLabel}>Jemput</span>
            {bisaEdit ? (
              <button style={s.jamBtn} onClick={() => setEditing({ hari: key, aksi: 'jemput' })}>
                {draft[key]?.jemput || 'Atur jam'}
              </button>
            ) : (
              <span style={draft[key]?.jemput ? s.jamBaca : s.jamKosong}>
                {draft[key]?.jemput || 'Belum diisi'}
              </span>
            )}
          </div>
        </div>
      ))}

      {bisaEdit && (
        <button style={s.simpanBtn} onClick={handleSimpan} disabled={menyimpan}>
          {menyimpan ? 'Menyimpan…' : tersimpan ? 'Tersimpan ✓' : 'Simpan jadwal'}
        </button>
      )}

      {editing && createPortal(
        <div style={s.overlay} onClick={() => setEditing(null)}>
          <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.sheetTitle}>
              {labelHariEditing} · {editing.aksi === 'antar' ? 'Antar' : 'Jemput'}
            </div>
            <TimeWheelPicker
              value={nilaiEditing}
              onChange={(jam) => ubahJam(editing.hari, editing.aksi, jam)}
            />
            <button style={s.selesaiBtn} onClick={() => setEditing(null)}>
              Selesai
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  hariBlok: {
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  hariLabel: { fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 },
  aksiRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
  },
  aksiLabel: { fontSize: 13.5, color: '#8FB4DC' },
  jamBtn: {
    fontFamily: 'var(--font-data)',
    fontSize: 13,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 8,
    padding: '7px 12px',
    color: 'var(--text)',
    minWidth: 96,
    textAlign: 'center',
  },
  jamBaca: {
    fontFamily: 'var(--font-data)', fontSize: 13,
    color: 'var(--glow-blue)', textShadow: '0 0 4px var(--glow-blue-mid)',
  },
  jamKosong: { fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic' },
  simpanBtn: {
    marginTop: 6,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
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
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  sheetTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'center' },
  selesaiBtn: {
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },
}