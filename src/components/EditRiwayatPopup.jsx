import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function EditRiwayatPopup({ item, onClose, onSimpan }) {
  const { t } = useLanguage()
  const [tanggal, setTanggal] = useState(item.tanggal)
  const [where, setWhere] = useState(item.where)
  const [jam, setJam] = useState(item.jam)
  const [tarif, setTarif] = useState(String(item.tarif))

  function handleSimpan() {
    onSimpan({
      tanggal,
      where,
      jam,
      tarif: Number(tarif) || 0,
    })
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.judul}>{t.editRiwayatTitle}</div>

        <label style={s.label}>
          {t.labelTanggal}
          <input
            style={s.input}
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </label>

        <label style={s.label}>
          {t.labelTempat}
          <input
            style={s.input}
            type="text"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
          />
        </label>

        <label style={s.label}>
          {t.labelJam}
          <input
            style={s.input}
            type="time"
            value={jam}
            onChange={(e) => setJam(e.target.value)}
          />
        </label>

        <label style={s.label}>
          {t.labelJumlahBayar}
          <input
            style={s.input}
            type="number"
            inputMode="numeric"
            value={tarif}
            onChange={(e) => setTarif(e.target.value)}
          />
        </label>

        <div style={s.tombolRow}>
          <button style={s.btnBatal} onClick={onClose}>{t.batal}</button>
          <button style={s.btnSimpan} onClick={handleSimpan}>{t.simpanPerubahan}</button>
        </div>
      </div>
    </div>
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
    maxWidth: 360,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--blue-border)',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  judul: {
    fontFamily: 'var(--font-judul)',
    fontSize: 18,
    color: 'var(--text)',
    letterSpacing: '0.5px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 12.5,
    color: '#9FC3E8',
  },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '10px 12px',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'var(--font-data)',
  },
  tombolRow: {
    display: 'flex',
    gap: 10,
    marginTop: 6,
  },
  btnBatal: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text)',
    fontSize: 14,
    border: '1px solid var(--blue-border)',
  },
  btnSimpan: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 10,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
  },
}
