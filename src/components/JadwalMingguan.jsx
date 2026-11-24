import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { createPortal } from 'react-dom'
import { HARI_KERJA_KEYS } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import TimeWheelPicker from './TimeWheelPicker.jsx'
import SwipeableCheck from './SwipeableCheck.jsx'
import JadwalBacaOjek, { ambilHariAktif } from './JadwalBacaOjek.jsx'

function buatJadwalKosong() {
  const kosong = {}
  HARI_KERJA_KEYS.forEach((key) => {
    kosong[key] = { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false }
  })
  return kosong
}

const JadwalMingguan = forwardRef(function JadwalMingguan(
  { jadwal, onSimpan, bisaEdit, bisaTandaiSelesai = false, onTandaiSelesai, hariBaru = null, tahanSinkron = false },
  ref
) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState(jadwal)
  const [menyimpan, setMenyimpan] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)
  const [editing, setEditing] = useState(null)
  const [tempJam, setTempJam] = useState('07:00')

  // tahanSinkron (akun ojek, saat jadwal biasa diisi berurutan): isi dari server ditahan dulu supaya hari dan jamnya
  // tidak langsung penuh sebelum animasi isi berjalan
  useEffect(() => {
    if (!tahanSinkron) setDraft(jadwal)
  }, [jadwal, tahanSinkron])

  useImperativeHandle(ref, () => ({
    reset: () => setDraft(buatJadwalKosong()),
    // Dipakai akun ojek untuk tombol jadwal biasa (opt-in): isi satu hari, baca, dan pasang kembali isi form
    isiHari: (hari, data) => setDraft((d) => ({ ...(d || buatJadwalKosong()), [hari]: { ...(d?.[hari] || {}), ...data } })),
    ambilDraft: () => draft,
    pasangDraft: (d) => setDraft(d),
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

  // Mode baca (ojek, atau penumpang setelah jadwal disimpan): kartu per hari. Mode isi tetap daftar ringkas satu layar.
  const hariAktif = ambilHariAktif(draft)
  if (!bisaEdit && hariAktif.length >= 1) {
    return <JadwalBacaOjek key={hariAktif.map((h) => h.key).join('-')} hari={hariAktif} onTandaiSelesai={bisaTandaiSelesai ? onTandaiSelesai : undefined} />
  }

  return (
    <div style={s.wrap}>
      {HARI_KERJA_KEYS.map((key, i) => {
        const label = t.hariLabel[i]
        const selesai = Boolean(draft[key]?.selesai)
        const adaJadwal = Boolean(draft[key]?.antar?.aktif) || Boolean(draft[key]?.jemput?.aktif)
        if (!bisaEdit && !adaJadwal) return null

        const isiHari = (
          <div className={hariBaru === key ? 'jadwal-isi' : undefined} style={{ ...s.hariBlok, ...(selesai && bisaTandaiSelesai ? s.hariBlokSelesai : {}) }}>
            {selesai && bisaTandaiSelesai && (
              <span style={s.badgeSelesai}>
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#08130d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
            )}
            <div style={adaJadwal ? s.hariLabel : s.hariLabelRedup}>
              <span style={adaJadwal ? s.penanda : s.penandaKosong} />
              {label}
            </div>

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
            <div key={key} className="naik-masuk" style={{ '--i': i + 1 }}>
              <SwipeableCheck selesai={selesai} onToggle={(v) => handleToggleSelesai(key, v)}>
                {isiHari}
              </SwipeableCheck>
            </div>
          )
        }

        return <div key={key} className="naik-masuk" style={{ '--i': i + 1 }}>{isiHari}</div>
      })}

      {bisaEdit && (
        <button className="tekan naik-masuk" style={{ ...s.simpanBtn, '--i': 7 }} onClick={handleSimpan} disabled={menyimpan}>
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
              <button className="tekan" style={s.cancelBtn} onClick={handleCancelJam}>{t.batal}</button>
              <button className="tekan" style={s.selesaiBtn} onClick={handleSelesaiJam}>{t.selesai}</button>
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
  // Mode baca (akun Ojek): cuma teks, nggak ada tombol.
  if (!bisaEdit) {
    if (!aktif) return <span style={s.bacaRedup}>{label}</span>
    return (
      <div style={s.slotAktif}>
        <span style={s.bacaAktif}>{label}</span>
        <span style={s.bacaJam}>{jam || placeholderJam}</span>
      </div>
    )
  }

  if (!aktif) {
    return (
      <button className="tekan" style={s.chip} onClick={onToggle} aria-pressed={false}>
        {label}
      </button>
    )
  }

  return (
    <div style={s.slotAktif}>
      <button className="tekan" style={s.chipAktif} onClick={onToggle} aria-pressed>
        {label}
      </button>
      <button className="tekan" style={jam ? s.jamBtn : s.jamBtnKosong} onClick={onBukaJam}>
        {jam || placeholderJam}
      </button>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column' },
  hariBlok: {
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--bg)',
    borderBottom: '1px solid var(--garis)',
    padding: '4px 0',
    display: 'grid',
    gridTemplateColumns: '98px 1fr',
    alignItems: 'center',
    gap: 8,
    transition: 'box-shadow 0.25s ease, background 0.25s ease',
  },
  hariBlokSelesai: {
    background: 'var(--panel)',
    boxShadow: 'inset 0 0 0 1px var(--glow-blue)',
    padding: '10px 8px',
  },
  hariLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13.5,
    fontWeight: 600,
    lineHeight: 1.3,
    color: 'var(--text)',
  },
  hariLabelRedup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13.5,
    fontWeight: 600,
    lineHeight: 1.3,
    color: 'var(--text-dim)',
  },
  penanda: { width: 8, height: 8, borderRadius: 0, background: 'var(--glow-blue)', flexShrink: 0 },
  penandaKosong: { width: 8, height: 8, borderRadius: 0, boxSizing: 'border-box', border: '2px solid #7FA3BC', flexShrink: 0 },
  badgeSelesai: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    background: 'var(--glow-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  aksiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  // Slot yang nyala: label di kiri, jam di kanan, satu blok gelap.
  slotAktif: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'center',
    background: 'var(--panel)',
    borderRadius: 0,
    minWidth: 0,
  },
  chip: {
    whiteSpace: 'nowrap',
    height: 34,
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'center',
    color: 'var(--text-dim)',
    border: '1px solid var(--garis)',
    borderRadius: 0,
  },
  chipAktif: {
    whiteSpace: 'nowrap',
    height: 34,
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'center',
    color: 'var(--glow-blue)',
  },
  jamBtn: {
    height: 34,
    fontFamily: 'var(--font-data)',
    fontSize: 13,
    textAlign: 'center',
    color: 'var(--text)',
    borderLeft: '1px solid var(--garis)',
  },
  jamBtnKosong: {
    height: 34,
    fontSize: 12,
    textAlign: 'center',
    color: 'var(--text-dim)',
    borderLeft: '1px solid var(--garis)',
  },
  bacaAktif: {
    whiteSpace: 'nowrap',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '34px',
    textAlign: 'center',
    color: 'var(--glow-blue)',
  },
  bacaJam: {
    fontFamily: 'var(--font-data)',
    fontSize: 13,
    lineHeight: '34px',
    textAlign: 'center',
    color: 'var(--text)',
    borderLeft: '1px solid var(--garis)',
  },
  bacaRedup: {
    whiteSpace: 'nowrap',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '34px',
    textAlign: 'center',
    color: 'var(--text-dim)',
    opacity: 0.6,
  },
  simpanBtn: {
    marginTop: 14,
    height: 44,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 0,
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
    background: 'var(--panel)',
    border: '2px solid var(--glow-blue)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  sheetTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'center' },
  tombolRow: { display: 'flex', gap: 10 },
  cancelBtn: {
    flex: 1,
    height: 48,
    color: 'var(--text)',
    fontSize: 15,
    fontWeight: 600,
    border: '1px solid var(--garis)',
    borderRadius: 0,
  },
  selesaiBtn: {
    flex: 1,
    height: 48,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 0,
  },
}
