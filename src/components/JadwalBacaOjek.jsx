import { HARI_KERJA_KEYS } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useEffect } from 'react'
import SwipeableCheck from './SwipeableCheck.jsx'
import { playJamTik } from '../lib/sound'
import { getar } from '../lib/getar'

// Tampilan baca jadwal (akun ojek dan penumpang setelah jadwal disimpan). Satu kartu per hari yang punya jadwal,
// slot Antar dan Jemput selalu dua kolom sama lebar, slot yang kosong tampil putus-putus.
// Selalu satu kolom ke bawah, berapa pun jumlah harinya.

export function ambilHariAktif(draft) {
  return HARI_KERJA_KEYS.map((key, i) => ({ key, i, data: draft?.[key] || {} }))
    .filter(({ data }) => data.antar?.aktif || data.jemput?.aktif)
}

export default function JadwalBacaOjek({ hari, onTandaiSelesai }) {
  const { t, lang } = useLanguage()
  const hariIni = (new Date().getDay() + 6) % 7 // 0 = Senin
  const bisaTandai = Boolean(onTandaiSelesai)
  const teksHariIni = lang === 'en' ? 'TODAY' : 'HARI INI'

  // Satu klik kecil dan getar ringan untuk tiap kartu yang masuk, selaras dengan jeda animasinya
  useEffect(() => {
    const ids = hari.map((_, n) => setTimeout(() => { playJamTik(); getar(6) }, 120 + n * 90))
    return () => ids.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const slot = (aksi, data, tunda) => {
    const aktif = Boolean(data?.aktif)
    return (
      <div style={aktif ? s.slot : s.slotKosong}>
        <span style={aktif ? s.slotLabel : s.slotLabelKosong}>{aksi === 'antar' ? t.antar : t.jemput}</span>
        <span className={aktif ? 'jam-nyala' : undefined} style={{ ...s.slotJam, ...(aktif ? null : s.slotJamKosong), '--tunda': `${tunda}ms` }}>
          {aktif ? (data.jam || '--:--') : '--'}
        </span>
      </div>
    )
  }

  const kartu = (h, n) => {
    const selesai = Boolean(h.data.selesai)
    const isi = (
      <div style={{ ...s.kartu, ...(selesai ? s.kartuSelesai : null) }}>
        {selesai && <span style={s.badgeSelesai} aria-hidden="true">✓</span>}
        <div style={{ ...s.isi, opacity: selesai ? 0.55 : 1 }}>
          <div style={s.atas}>
            <span style={{ ...s.hari }}>{t.hariLabel[h.i]}</span>
            {h.i === hariIni && <span style={s.hariIni}>{teksHariIni}</span>}
          </div>
          <div style={{ ...s.slotGrid }}>
            {slot('antar', h.data.antar, 200 + n * 90)}
            {slot('jemput', h.data.jemput, 280 + n * 90)}
          </div>
        </div>
      </div>
    )
    return (
      <div key={h.key} className="kartu-pop" style={{ '--tunda': `${n * 90}ms` }}>
        {bisaTandai ? (
          <SwipeableCheck selesai={selesai} onToggle={(v) => onTandaiSelesai(h.key, v)}>{isi}</SwipeableCheck>
        ) : isi}
      </div>
    )
  }

  return <div style={{ ...s.wrap }}>{hari.map(kartu)}</div>
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  kartu: { position: 'relative', background: 'var(--panel)', boxShadow: 'inset 0 0 0 1px var(--garis)', boxSizing: 'border-box', height: '100%', transition: 'box-shadow 0.25s ease' },
  kartuSelesai: { boxShadow: 'inset 0 0 0 1px var(--glow-blue)' },
  badgeSelesai: { position: 'absolute', top: 6, right: 6, width: 14, height: 14, background: 'var(--glow-blue)', color: '#08130d', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  isi: { padding: '14px 14px 16px', transition: 'opacity 0.25s ease' },
  atas: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, minHeight: 26 },
  hari: { fontFamily: 'var(--font-judul)', fontSize: 26, lineHeight: 1.1, letterSpacing: '1px', color: '#fff', textShadow: '0 0 10px rgba(94, 208, 255, 0.4)' },
  hariIni: { fontSize: 9, letterSpacing: '0.12em', fontWeight: 700, color: '#04192A', background: '#FF9A3C', padding: '2px 6px', lineHeight: '12px' },

  slotGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  slot: { borderTop: '2px solid var(--glow-blue)', paddingTop: 4, minWidth: 0 },
  slotKosong: { borderTop: '2px dashed var(--garis)', paddingTop: 4, minWidth: 0, opacity: 0.5 },
  slotLabel: { display: 'block', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--glow-blue)', fontWeight: 700 },
  slotLabelKosong: { display: 'block', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 },
  slotJam: { display: 'block', fontFamily: 'var(--font-data)', fontVariantNumeric: 'tabular-nums', fontSize: 24, lineHeight: 1.2, color: 'var(--text)' },
  slotJamKosong: { color: 'var(--text-dim)' },
}
