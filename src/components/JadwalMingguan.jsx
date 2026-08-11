import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { createPortal } from 'react-dom'
import { HARI_KERJA_KEYS } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import TimeWheelPicker from './TimeWheelPicker.jsx'
import SwipeableCheck from './SwipeableCheck.jsx'

function buatJadwalKosong() {
  const kosong = {}
  HARI_KERJA_KEYS.forEach((key) => {
    kosong[key] = { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false }
  })
  return kosong
}

const JadwalMingguan = forwardRef(function JadwalMingguan(
  { jadwal, onSimpan, bisaEdit, bisaTandaiSelesai = false, onTandaiSelesai },
  ref
) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState(jadwal)
  const [menyimpan, setMenyimpan] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)
  const [editing, setEditing] = useState(null)
  const [tempJam, setTempJam] = useState('07:00')

  useEffect(() => {
    setDraft(jadwal)
  }, [jadwal])

  useImperativeHandle(ref, () => ({
    reset: () => setDraft(buatJadwalKosong()),
  }))

  if (!draft) return null

  function toggleAksi(hari, aksi) {
    setDraft((d) => ({
      ...d,
      [hari]: {
        ...d[hari],
        [aksi]: {
          aktif: !d[hari]?.[aksi]?.aktif,
          jam: d[hari]?.[aksi]?.jam || '',
        },
      },
    }))
  }

  function bukaEditJam(hari, aksi) {
    setTempJam(draft[hari]?.[aksi]?.jam || '07:00')
    setEditing({ hari, aksi })
  }

  function handleSelesaiJam() {
    setDraft((d) => ({
      ...d,
      [editing.hari]: {
        ...d[editing.hari],
        [editing.aksi]: { ...d[editing.hari]?.[editing.aksi], jam: tempJam },
      },
    }))
    setEditing(null)
  }

  function handleCancelJam() {
    setEditing(null)
  }

  async function handleSimpan() {
    setMenyimpan(true)
    await onSimpan(draft)
    setMenyimpan(false)
    setTersimpan(true)
    setTimeout(() => setTersimpan(false), 2000)
  }

  function handleToggleSelesai(hari, nilaiBaru) {
    onTandaiSelesai?.(hari, nilaiBaru)
  }

  const indexHariEditing = editing ? HARI_KERJA_KEYS.indexOf(editing.hari) : -1
  const labelHariEditing = indexHariEditing >= 0 ? t.hariLabel[indexHariEditing] : ''

  return (
    <div style={s.wrap}>
      {HARI_KERJA_KEYS.map((key, i) => {
        const label = t.hariLabel[i]
        const adaJadwal = Boolean(draft[key]?.antar?.aktif) || Boolean(draft[key]?.jemput?.aktif)
        if (!bisaEdit && !adaJadwal) return null

        const selesai = Boolean(draft[key]?.selesai)

        const isiHari = (
          <div style={{ ...s.hariBlok, ...(selesai && bisaTandaiSelesai ? s.hariBlokSelesai : {}) }}>
            {selesai && bisaTandaiSelesai && (
              <div style={s.badgeSelesai}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#08130d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            )}
            <div style={s.hariLabel}>{label}</div>

            <div style={s.aksiGrid}>
              <AksiChip
                label={t.antar}
                aktif={Boolean(draft[key]?.antar?.aktif)}
                jam={draft[key]?.antar?.jam}
                bisaEdit={bisaEdit}
                onToggle={() => toggleAksi(key, 'antar')}
                onBukaJam={() => bukaEditJam(key, 'antar')}
                placeholderJam={t.jamOpsional}
              />
              <AksiChip
                label={t.jemput}
                aktif={Boolean(draft[key]?.jemput?.aktif)}
                jam={draft[key]?.jemput?.jam}
                bisaEdit={bisaEdit}
                onToggle={() => toggleAksi(key, 'jemput')}
                onBukaJam={() => bukaEditJam(key, 'jemput')}
                placeholderJam={t.jamOpsional}
              />
            </div>
          </div>
        )

        if (bisaTandaiSelesai && adaJadwal) {
          return (
            <SwipeableCheck key={key} selesai={selesai} onToggle={(v) => handleToggleSelesai(key, v)}>
              {isiHari}
            </SwipeableCheck>
          )
        }

        return <div key={key}>{isiHari}</div>
      })}

      {bisaEdit && (
        <button style={s.simpanBtn} onClick={handleSimpan} disabled={menyimpan}>
          {menyimpan ? t.menyimpan : tersimpan ? t.tersimpan : t.simpanJadwal}
        </button>
      )}

      {editing && createPortal(
        <div style={s.overlay} onClick={handleCancelJam}>
          <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.sheetTitle}>
              {labelHariEditing} · {editing.aksi === 'antar' ? t.antar : t.jemput}
            </div>
            <TimeWheelPicker value={tempJam} onChange={setTempJam} />
            <div style={s.tombolRow}>
              <button style={s.cancelBtn} onClick={handleCancelJam}>{t.batal}</button>
              <button style={s.selesaiBtn} onClick={handleSelesaiJam}>{t.selesai}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})

export default JadwalMingguan

function AksiChip({ label, aktif, jam, bisaEdit, onToggle, onBukaJam, placeholderJam }) {
  return (
    <div style={s.aksiItem}>
      {bisaEdit ? (
        <button style={aktif ? s.chipAktif : s.chip} onClick={onToggle}>
          {label}
        </button>
      ) : (
        <span style={aktif ? s.chipBacaAktif : s.chipBacaRedup}>{label}</span>
      )}

      <div style={s.jamSlot}>
        {aktif && bisaEdit && (
          <button style={jam ? s.jamBtn : s.jamBtnKosong} onClick={onBukaJam}>
            {jam || placeholderJam}
          </button>
        )}
        {aktif && !bisaEdit && (
          <span style={s.jamBacaTeks}>{jam || placeholderJam}</span>
        )}
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  hariBlok: {
    position: 'relative',
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '12px 14px',
    display: 'grid',
    gridTemplateColumns: '78px 1fr',
    alignItems: 'center',
    gap: 8,
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
  },
  hariBlokSelesai: {
    border: '1px solid var(--glow-blue)',
    boxShadow: '0 0 10px rgba(94,208,255,0.55)',
    background: 'linear-gradient(160deg, rgba(94,208,255,0.10), var(--card-blue))',
  },
  badgeSelesai: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'var(--glow-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 8px rgba(94,208,255,0.8), 0 2px 4px rgba(0,0,0,0.4)',
  },
  hariLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
  },
  aksiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  aksiItem: {
    display: 'grid',
    gridTemplateColumns: '62px 1fr',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '7px 0',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    border: '1px solid var(--blue-border)',
  },
  chipAktif: {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '7px 0',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
    borderRadius: 999,
    background: 'rgba(94,208,255,0.18)',
    color: 'var(--glow-blue)',
    border: '1px solid var(--glow-blue-mid)',
    textShadow: '0 0 4px var(--glow-blue-mid)',
  },
  chipBacaAktif: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--glow-blue)',
    textShadow: '0 0 4px var(--glow-blue-mid)',
  },
  chipBacaRedup: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--text-dim)',
    opacity: 0.5,
  },
  jamSlot: {
    minWidth: 0,
  },
  jamBtn: {
    fontFamily: 'var(--font-data)',
    fontSize: 12.5,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 8,
    padding: '6px 4px',
    color: 'var(--text)',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  jamBtnKosong: {
    fontFamily: 'var(--font-data)',
    fontSize: 12.5,
    background: 'rgba(255,255,255,0.06)',
    border: '1px dashed var(--blue-border)',
    borderRadius: 8,
    padding: '6px 4px',
    color: 'var(--text-dim)',
    width: '100%',
    boxSizing: 'border-box',
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
  tombolRow: { display: 'flex', gap: 10 },
  cancelBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
  selesaiBtn: {
    flex: 1,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },
}