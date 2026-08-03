import { useState } from 'react'

const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export default function MonthPickerPopup({ bulan, tahun, onClose, onSelect }) {
  const [tahunLihat, setTahunLihat] = useState(tahun)

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.yearRow}>
          <button style={s.arrow} onClick={() => setTahunLihat((t) => t - 1)} aria-label="Tahun sebelumnya">‹</button>
          <div style={s.yearLabel}>{tahunLihat}</div>
          <button style={s.arrow} onClick={() => setTahunLihat((t) => t + 1)} aria-label="Tahun berikutnya">›</button>
        </div>

        <div style={s.grid}>
          {NAMA_BULAN.map((nama, i) => {
            const aktif = i === bulan && tahunLihat === tahun
            return (
              <button
                key={nama}
                style={aktif ? s.cellAktif : s.cell}
                onClick={() => onSelect(i, tahunLihat)}
              >
                {nama}
              </button>
            )
          })}
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
    gap: 18,
  },
  yearRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  arrow: {
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, color: '#8FB4DC', borderRadius: '50%',
  },
  yearLabel: { fontFamily: 'var(--font-data)', fontSize: 17, fontWeight: 700, color: 'var(--text)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  cell: {
    padding: '12px 0', borderRadius: 10,
    background: 'rgba(255,255,255,0.06)', color: 'var(--text)', fontSize: 14,
    border: '1px solid var(--blue-border)',
  },
  cellAktif: {
    padding: '12px 0', borderRadius: 10,
    background: 'var(--nav-red)', color: '#fff', fontSize: 14, fontWeight: 600,
  },
}