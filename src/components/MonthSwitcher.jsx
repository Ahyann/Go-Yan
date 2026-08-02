export default function MonthSwitcher({ bulan, tahun, onPrev, onNext }) {
  const namaBulan = new Date(tahun, bulan, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div style={s.wrap}>
      <button style={s.arrow} onClick={onPrev} aria-label="Bulan sebelumnya">‹</button>
      <div style={s.label}>{namaBulan}</div>
      <button style={s.arrow} onClick={onNext} aria-label="Bulan berikutnya">›</button>
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 999,
    padding: '6px 6px',
  },
  arrow: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: 'var(--text-dim)',
    borderRadius: '50%',
  },
  label: {
    fontSize: 14.5,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
}