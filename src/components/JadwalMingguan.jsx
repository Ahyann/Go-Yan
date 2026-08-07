import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { HARI_KERJA_KEYS } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import TimeWheelPicker from './TimeWheelPicker.jsx'

export default function JadwalMingguan({ jadwal, onSimpan, bisaEdit }) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState(jadwal)
  const [menyimpan, setMenyimpan] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    setDraft(jadwal)
  }, [jadwal])

  if (!draft) return null

  function toggleAksi(hari, aksi) {
    setDraft((d) => ({
      ...d,
      [hari]: {
        ...d[hari],
        [aksi]: d[hari]?.[aksi] ? '' : (aksi === 'antar' ? '07:00' : '15:30'),
      },
    }))
  }

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
  const indexHariEditing = editing ? HARI_KERJA_KEYS.indexOf(editing.hari) : -1
  const labelHariEditing = indexHariEditing >= 0 ? t.hariLabel[indexHariEditing] : ''

  return (
    <div style={s.wrap}>
      {HARI_KERJA_KEYS.map((key, i) => {
        const label = t.hariLabel[i]
        const adaJadwal = Boolean(draft[key]?.antar) || Boolean(draft[key]?.jemput)
        if (!bisaEdit && !adaJadwal) return null

        return (
          <div key={key} style={s.hariBlok}>
            <div style={s.hariLabel}>{label}</div>

            <div style={s.aksiGrid}>
              <AksiChip
                label={t.antar}
                aktif={Boolean(draft[key]?.antar)}
                jam={draft[key]?.antar}
                bisaEdit={bisaEdit}
                onToggle={() => toggleAksi(key, 'antar')}
                onBukaJam={() => setEditing({ hari: key, aksi: 'antar' })}
              />
              <AksiChip
                label={t.jemput}
                aktif={Boolean(draft[key]?.jemput)}
                jam={draft[key]?.jemput}
                bisaEdit={bisaEdit}
                onToggle={() => toggleAksi(key, 'jemput')}
                onBukaJam={() => setEditing({ hari: key, aksi: 'jemput' })}
              />
            </div>
          </div>
        )
      })}

      {bisaEdit && (
        <button style={s.simpanBtn} onClick={handleSimpan} disabled={menyimpan}>
          {menyimpan ? t.menyimpan : tersimpan ? t.tersimpan : t.simpanJadwal}
        </button>
      )}

      {editing && createPortal(
        <div style={s.overlay} onClick={() => setEditing(null)}>
          <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.sheetTitle}>
              {labelHariEditing} · {editing.aksi === 'antar' ? t.antar : t.jemput}
            </div>
            <TimeWheelPicker
              value={nilaiEditing}
              onChange={(jam) => ubahJam(editing.hari, editing.aksi, jam)}
            />
            <button style={s.selesaiBtn} onClick={() => setEditing(null)}>
              {t.selesai}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function AksiChip({ label, aktif, jam, bisaEdit, onToggle, onBukaJam }) {
  if (!bisaEdit && !aktif) return null

  return (
    <div style={s.aksiItem}>
      {bisaEdit ? (
        <button style={aktif ? s.chipAktif : s.chip} onClick={onToggle}>
          {label}
        </button>
      ) : (
        <span style={s.chipBaca}>{label}</span>
      )}

      {aktif && bisaEdit && (
        <button style={s.jamBtn} onClick={onBukaJam}>{jam}</button>
      )}
      {aktif && !bisaEdit && <span style={s.jamBacaTeks}>{jam}</span>}
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  hariBlok: {
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  hariLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
    width: 78,
    flexShrink: 0,
  },
  aksiGrid: {
    display: 'flex',
    flex: 1,
    gap: 10,
  },
  aksiItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  chip: {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '7px 0',
    width: 62,
    textAlign: 'center',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    border: '1px solid var(--blue-border)',
    flexShrink: 0,
  },
  chipAktif: {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '7px 0',
    width: 62,
    textAlign: 'center',
    borderRadius: 999,
    background: 'rgba(94,208,255,0.18)',
    color: 'var(--glow-blue)',
    border: '1px solid var(--glow-blue-mid)',
    textShadow: '0 0 4px var(--glow-blue-mid)',
    flexShrink: 0,
  },
  chipBaca: {
    fontSize: 12.5,
    fontWeight: 600,
    color: '#8FB4DC',
    width: 46,
    flexShrink: 0,
  },
  jamBtn: {
    fontFamily: 'var(--font-data)',
    fontSize: 12.5,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 8,
    padding: '6px 8px',
    color: 'var(--text)',
    minWidth: 0,
    flex: 1,
    textAlign: 'center',
  },
  jamBacaTeks: {
    fontFamily: 'var(--font-data)', fontSize: 12.5,
    color: 'var(--glow-blue)', textShadow: '0 0 4px var(--glow-blue-mid)',
  },
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
