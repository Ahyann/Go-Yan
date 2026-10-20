import { MODE_SUARA } from '../lib/sound'
import { useModeSuara } from '../lib/useModeSuara'
import { useLanguage } from '../context/LanguageContext.jsx'

// Kartu pengaturan suara di tab Akun (dipakai akun Ahyan dan Fajri).
export default function PengaturanSuara() {
  const { t } = useLanguage()
  const [mode, setMode] = useModeSuara()

  const pilihan = [
    { mode: MODE_SUARA.NORMAL, nama: t.suaraNormal, desc: t.suaraNormalDesc },
    { mode: MODE_SUARA.TANPA_VOICE, nama: t.suaraTanpaVoice, desc: t.suaraTanpaVoiceDesc },
    { mode: MODE_SUARA.SENYAP, nama: t.suaraSenyap, desc: t.suaraSenyapDesc },
  ]
  const terpilih = pilihan.find((p) => p.mode === mode) ?? pilihan[0]

  return (
    <section style={s.card}>
      <div style={s.label}>{t.suaraLabel}</div>
      <div style={s.desc}>{terpilih.desc}</div>
      <div style={s.kolom} role="radiogroup" aria-label={t.suaraLabel}>
        {pilihan.map((p) => (
          <button
            key={p.mode}
            type="button"
            role="radio"
            aria-checked={p.mode === mode}
            style={p.mode === mode ? s.btnAktif : s.btn}
            onClick={() => setMode(p.mode)}
          >
            {p.nama}
          </button>
        ))}
      </div>
      <div style={s.catatan}>{t.suaraCatatan}</div>
    </section>
  )
}

const s = {
  card: {
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 12,
    padding: 18,
  },
  label: { fontSize: 12.5, color: '#9FC3E8', marginBottom: 6 },
  desc: { fontSize: 13, color: '#8FB4DC', marginBottom: 14, lineHeight: 1.4 },
  kolom: { display: 'flex', flexDirection: 'column', gap: 10 },
  btn: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px',
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
  btnAktif: {
    width: '100%',
    background: 'rgba(94,208,255,0.15)',
    color: 'var(--glow-blue)',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px',
    borderRadius: 999,
    border: '1px solid var(--glow-blue-mid)',
  },
  catatan: { fontSize: 11.5, color: 'var(--text-dim)', marginTop: 12, lineHeight: 1.4 },
}
