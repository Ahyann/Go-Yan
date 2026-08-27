import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { STATUS_BAYAR } from '../lib/constants'

export default function EditRiwayatPopup({ item, onClose, onSimpan }) {
  const { t } = useLanguage()
  const [tanggal, setTanggal] = useState(item.tanggal)
  const [where, setWhere] = useState(item.where)
  const [jam, setJam] = useState(item.jam)
  const [tarif, setTarif] = useState(String(item.tarif))
  const [statusBayar, setStatusBayar] = useState(item.statusBayar)

  function handleSimpan() {
    onSimpan({
      tanggal,
      where,
      jam,
      tarif: Number(tarif) || 0,
      statusBayar,
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

        <label style={s.label}>
          {t.labelStatusBayar}
          <div style={s.statusRow}>
            <button
              type="button"
              style={statusBayar === STATUS_BAYAR.BELUM ? s.statusBtnAktifBelum : s.statusBtn}
              onClick={() => setStatusBayar(STATUS_BAYAR.BELUM)}
            >
              {t.belum}
            </button>
            <button
              type="button"
              style={statusBayar === STATUS_BAYAR.LUNAS ? s.statusBtnAktifLunas : s.statusBtn}
              onClick={() => setStatusBayar(STATUS_BAYAR.LUNAS)}
            >
              {t.lunas}
            </button>
          </div>
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
  statusRow: {
    display: 'flex',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    color: 'var(--text)',
    fontSize: 13,
  },
  statusBtnAktifBelum: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    background: 'rgba(255,180,60,0.18)',
    border: '1px solid #FFB43C',
    color: '#FFB43C',
    fontSize: 13,
    fontWeight: 600,
  },
  statusBtnAktifLunas: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    background: 'rgba(60,200,120,0.18)',
    border: '1px solid #3CC878',
    color: '#3CC878',
    fontSize: 13,
    fontWeight: 600,
  },
}
