import { MODE_SUARA } from '../lib/sound'
import { useModeSuara } from '../lib/useModeSuara'
import { useLanguage } from '../context/LanguageContext.jsx'

// Kartu pengaturan suara di tab Akun (dipakai akun Ahyan dan Fajri).
export default function PengaturanSuara() {
  const { t } = useLanguage()
  const [mode, setMode] = useModeSuara()

  const pilihan = [
    { mode: MODE_SUARA.TANPA_VOICE, nama: t.suaraTanpaVoice, desc: t.suaraTanpaVoiceDesc },
    { mode: MODE_SUARA.SENYAP, nama: t.suaraSenyap, desc: t.suaraSenyapDesc },
  ]
  const indeks = Math.max(0, pilihan.findIndex((p) => p.mode === mode))
  const terpilih = pilihan[indeks]
  // Panah kiri kanan berputar: setelah pilihan terakhir kembali ke yang pertama.
  const geser = (arah) => setMode(pilihan[(indeks + arah + pilihan.length) % pilihan.length].mode)

  return (
    <section style={s.card}>
      <div style={s.label}>{t.suaraLabel}</div>
      <div style={s.pemilih} role="group" aria-label={t.suaraLabel}>
        <button type="button" className="tekan" style={s.panah} onClick={() => geser(-1)} aria-label={t.suaraSebelumnya}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={s.nilai} aria-live="polite">
          <span>{terpilih.nama}</span>
          <div style={s.titikBaris} aria-hidden="true">
            {pilihan.map((p, i) => (
              <span key={p.mode} style={{ ...s.titik, width: i === indeks ? 14 : 8, background: i === indeks ? 'var(--glow-blue)' : 'var(--blue-border)' }} />
            ))}
          </div>
        </div>
        <button type="button" className="tekan" style={s.panah} onClick={() => geser(1)} aria-label={t.suaraBerikutnya}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}

const s = {
  card: {
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 0,
    padding: 14,
  },
  label: { fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--glow-blue)', textTransform: 'uppercase', marginBottom: 10 },
  pemilih: { display: 'flex', alignItems: 'stretch', gap: 6, height: 48 },
  panah: {
    width: 44,
    flexShrink: 0,
    background: 'rgba(1,42,64,0.6)',
    border: '1px solid var(--blue-border)',
    color: 'var(--glow-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nilai: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'rgba(94,208,255,0.1)',
    border: '1px solid var(--glow-blue-mid)',
    color: 'var(--text)',
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
  },
  titikBaris: { display: 'flex', gap: 3 },
  titik: { height: 4, display: 'block' },
}
