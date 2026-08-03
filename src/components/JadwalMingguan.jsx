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
        <div key={key} style={s.hariBlok}>
          <div style={s.hariLabel}>{label}</div>

          <div style={s.aksiRow}>
            <span style={s.aksiLabel}>Antar</span>
            {bisaEdit ? (
              <input
                type="time"
                style={s.jamInput}
                value={draft[key]?.antar || ''}
                onChange={(e) => ubahJam(key, 'antar', e.target.value)}
              />
            ) : (
              <span style={draft[key]?.antar ? s.jamBaca : s.jamKosong}>
                {draft[key]?.antar || 'Belum diisi'}
              </span>
            )}
          </div>

          <div style={s.aksiRow}>
            <span style={s.aksiLabel}>Jemput</span>
            {bisaEdit ? (
              <input
                type="time"
                style={s.jamInput}
                value={draft[key]?.jemput || ''}
                onChange={(e) => ubahJam(key, 'jemput', e.target.value)}
              />
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
  jamInput: {
    fontFamily: 'var(--font-data)',
    fontSize: 13,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 8,
    padding: '6px 8px',
    color: 'var(--text)',
    width: 96,
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
}