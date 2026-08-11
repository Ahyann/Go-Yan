import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { createPortal } from 'react-dom'
import { HARI_KERJA_KEYS } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import TimeWheelPicker from './TimeWheelPicker.jsx'
import SwipeableCheck from './SwipeableCheck.jsx'

function buatJadwalKosong() {
  const kosong = {}
  HARI_KERJA_KEYS.forEach((key) => {
    kosong[key] = { antar: { aktif: false, jam: '', selesai: false }, jemput: { aktif: false, jam: '', selesai: false } }
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
          selesai: d[hari]?.[aksi]?.selesai || false,
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

  // Nulis LANGSUNG ke server (gak nunggu tombol Simpan) — ini kenapa
  // fitur ini kepisah dari alur draft/Simpan yang dipake buat
  // antar/jemput/jam. Ditaro di sini (bukan cuma di useJadwalMingguan)
  // biar bisa dipanggil dari onClick di bawah.
  function handleToggleSelesai(hari, aksi, nilaiBaru) {
    onTandaiSelesai?.(hari, aksi, nilaiBaru)
  }

  const indexHariEditing = editing ? HARI_KERJA_KEYS.indexOf(editing.hari) : -1
  const labelHariEditing = indexHariEditing >= 0 ? t.hariLabel[indexHariEditing] : ''

  return (
    <div style={s.wrap}>
      {HARI_KERJA_KEYS.map((key, i) => {
        const label = t.hariLabel[i]
        const adaJadwal = Boolean(draft[key]?.antar?.aktif) || Boolean(draft[key]?.jemput?.aktif)
        if (!bisaEdit && !adaJadwal) return null

        return (
          <div key={key} style={s.hariBlok}>
            <div style={s.hariLabel}>{label}</div>

            <div style={s.aksiGrid}>
              <AksiSlot
                hari={key}
                aksiNama="antar"
                label={t.antar}
                aktif={Boolean(draft[key]?.antar?.aktif)}
                jam={draft[key]?.antar?.jam}
                selesai={Boolean(draft[key]?.antar?.selesai)}
                bisaEdit={bisaEdit}
                bisaTandaiSelesai={bisaTandaiSelesai}
                onToggle={() => toggleAksi(key, 'antar')}
                onBukaJam={() => bukaEditJam(key, 'antar')}
                onToggleSelesai={(v) => handleToggleSelesai(key, 'antar', v)}
                placeholderJam={t.jamOpsional}
              />
              <AksiSlot
                hari={key}
                aksiNama="jemput"
                label={t.jemput}
                aktif={Boolean(draft[key]?.jemput?.aktif)}
                jam={draft[key]?.jemput?.jam}
                selesai={Boolean(draft[key]?.jemput?.selesai)}
                bisaEdit={bisaEdit}
                bisaTandaiSelesai={bisaTandaiSelesai}
                onToggle={() => toggleAksi(key, 'jemput')}
                onBukaJam={() => bukaEditJam(key, 'jemput')}
                onToggleSelesai={(v) => handleToggleSelesai(key, 'jemput', v)}
                placeholderJam={t.jamOpsional}
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

// AksiSlot: bungkus AksiChip. Kalau bisaTandaiSelesai true (cuma di
// sisi Ahyan), dibungkus SwipeableCheck biar bisa digeser buat
// nandain "udah selesai" — border biru terang muncul di KEDUA sisi
// (Ahyan & Fajri) begitu ditandain, tapi cuma Ahyan yang bisa geser.
function AksiSlot({ aktif, selesai, bisaEdit, bisaTandaiSelesai, onToggleSelesai, ...props }) {
  const chip = <AksiChip aktif={aktif} bisaEdit={bisaEdit} selesai={selesai} {...props} />

  if (bisaTandaiSelesai && aktif) {
    return (
      <SwipeableCheck selesai={selesai} onToggle={onToggleSelesai}>
        {chip}
      </SwipeableCheck>
    )
  }

  return chip
}

function AksiChip({ label, aktif, jam, selesai, bisaEdit, onToggle, onBukaJam, placeholderJam }) {
  return (
    <div style={{ ...s.aksiItem, ...(selesai && aktif ? s.aksiItemSelesai : {}) }}>
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
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '12px 14px',
    display: 'grid',
    gridTemplateColumns: '78px 1fr',
    alignItems: 'center',
    gap: 8,
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
    borderRadius: 8,
    border: '1px solid transparent',
    padding: 2,
    boxSizing: 'border-box',
  },
  // Border biru terang — ini indikator "udah selesai", muncul di
  // KEDUA sisi (Ahyan & Fajri), cuma Ahyan yang bisa nyalain lewat
  // swipe. Sengaja bikin border doang (bukan ceklis nempel), biar gak
  // sesak di ruang yang udah kecil.
  aksiItemSelesai: {
    border: '1px solid var(--glow-blue)',
    boxShadow: '0 0 6px rgba(94,208,255,0.5)',
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
