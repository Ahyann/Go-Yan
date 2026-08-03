import { useEffect, useState } from 'react'
import { HARI_KERJA } from '../lib/constants'

export default function JadwalMingguan({ jadwal, onSimpan, bisaEdit }) {
  const [draft, setDraft] = useState(jadwal)
  const [menyimpan, setMenyimpan] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)

  useEffect(() => {
    setDraft(jadwal)
  }, [jadwal])

  if (!draft) return null

  function toggleAksi(hari, aksi) {
    setDraft((d) => ({
      ...d,
      [hari]: {
        ...d[hari],
        [aksi]: d[hari][aksi] ? '' : aksi === 'antar' ? '07:00' : '15:30',
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

  return (
    <div style={s.wrap}>
      {HARI_KERJA.map(({ key, label }) => (
        <div key={key} style={s.hariRow}>
          <div style={s.hariLabel}>{label}</div>
          <div style={s.aksiCol}>
            <AksiSlot
              label="Antar"
              aktif={Boolean(draft[key]?.antar)}
              jam={draft[key]?.antar}
              bisaEdit={bisaEdit}
              onToggle={() => toggleAksi(key, 'antar')}
              onJamChange={(jam) => ubahJam(key, 'antar', jam)}
            />
            <AksiSlot
              label="Jemput"
              aktif={Boolean(draft[key]?.jemput)}
              jam={draft[key]?.jemput}
              bisaEdit={bisaEdit}
              onToggle={() => toggleAksi(key, 'jemput')}
              onJamChange={(jam) => ubahJam(key, 'jemput', jam)}
            />
            {bisaEdit === false && !draft[key]?.antar && !draft[key]?.jemput && (
              <span style={s.kosongLabel}>Libur</span>
            )}
          </div>
        </div>
      ))}

      {bisaEdit && (
        <button style={s.simpanBtn} onClick={handleSimpan} disabled={menyimpan}>
          {menyimpan ? 'Menyimpan…' : tersimpan ? 'Tersimpan ✓' : 'Simpan jadwal'}
        </button>
      )}
    </div>
  )
}

function AksiSlot({ label, aktif, jam, bisaEdit, onToggle, onJamChange }) {
  if (!bisaEdit && !aktif) return null

  return (
    <div style={s.aksiRow}>
      {bisaEdit ? (
        <button style={aktif ? s.chipAktif : s.chip} onClick={onToggle}>
          {label}
        </button>
      ) : (
        <span style={s.chipBaca}>{label}</span>
      )}
      {aktif && bisaEdit && (
        <input
          type="time"
          style={s.jamInput}
          value={jam}
          onChange={(e) => onJamChange(e.target.value)}
        />
      )}
      {aktif && !bisaEdit && <span style={s.jamBaca}>{jam}</span>}
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  hariRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '12px 14px',
    gap: 10,
    flexWrap: 'wrap',
  },
  hariLabel: { fontSize: 14, fontWeight: 600, color: 'var(--text)', minWidth: 56 },
  aksiCol: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 },
  aksiRow: { display: 'flex', alignItems: 'center', gap: 6 },
  chip: {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    border: '1px solid var(--blue-border)',
  },
  chipAktif: {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: 999,
    background: 'rgba(94,208,255,0.15)',
    color: 'var(--glow-blue)',
    border: '1px solid var(--glow-blue-mid)',
    textShadow: '0 0 4px var(--glow-blue-mid)',
  },
  chipBaca: {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: 999,
    background: 'rgba(94,208,255,0.15)',
    color: 'var(--glow-blue)',
    border: '1px solid var(--glow-blue-mid)',
    textShadow: '0 0 4px var(--glow-blue-mid)',
  },
  jamInput: {
    fontFamily: 'var(--font-data)',
    fontSize: 12.5,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 8,
    padding: '5px 6px',
    color: 'var(--text)',
    width: 78,
  },
  jamBaca: { fontFamily: 'var(--font-data)', fontSize: 12.5, color: '#8FB4DC' },
  kosongLabel: { fontSize: 12.5, color: 'var(--text-dim)', fontStyle: 'italic' },
  simpanBtn: {
    marginTop: 6,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },
}