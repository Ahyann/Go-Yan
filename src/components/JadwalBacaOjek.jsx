import { HARI_KERJA_KEYS } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useEffect } from 'react'
import SwipeableCheck from './SwipeableCheck.jsx'
import { playJamTik } from '../lib/sound'
import { getar } from '../lib/getar'

// Tampilan jadwal untuk akun ojek (mode baca). Jadwal penumpang biasanya cuma 1 sampai 4 hari, jadi daftar
// biasa menyisakan layar kosong. Tiap jumlah hari punya susunan sendiri:
//   1 hari: kartu besar satu hari | 2 hari: dua kolom tinggi | 3 hari: garis waktu | 4 hari: kotak 2x2
// Lima hari ke atas memakai daftar biasa di JadwalMingguan.
export const MAKS_HARI_KARTU = 4

export function ambilHariAktif(draft) {
  return HARI_KERJA_KEYS.map((key, i) => ({ key, i, data: draft?.[key] || {} }))
    .filter(({ data }) => data.antar?.aktif || data.jemput?.aktif)
}

export default function JadwalBacaOjek({ hari, onTandaiSelesai }) {
  const { t, lang } = useLanguage()
  const hariIni = (new Date().getDay() + 6) % 7 // 0 = Senin
  const totalTrip = hari.reduce((n, h) => n + (h.data.antar?.aktif ? 1 : 0) + (h.data.jemput?.aktif ? 1 : 0), 0)
  // Satu klik kecil dan getar ringan untuk tiap kartu yang masuk, selaras dengan jeda animasinya
  useEffect(() => {
    const ids = hari.map((_, n) => setTimeout(() => { playJamTik(); getar(6) }, 120 + n * 140))
    return () => ids.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const teksHariIni = lang === 'en' ? 'TODAY' : 'HARI INI'
  const ringkasan = lang === 'en'
    ? `${hari.length} ${hari.length === 1 ? 'DAY' : 'DAYS'} · ${totalTrip} ${totalTrip === 1 ? 'TRIP' : 'TRIPS'}`
    : `${hari.length} HARI · ${totalTrip} TRIP`

  // Satu slot (antar atau jemput) dengan jam besar. Garis bawahnya tumbuh saat kartu muncul.
  const slot = (aksi, data, ukuran, tunda) => {
    if (!data?.aktif) return null
    return (
      <div key={aksi} style={{ ...s.slot, ...(ukuran === 'besar' ? s.slotBesar : null) }}>
        <span style={s.slotLabel}>{aksi === 'antar' ? t.antar : t.jemput}</span>
        <span className="jam-nyala" style={{ ...s.slotJam, fontSize: ukuran === 'besar' ? 34 : ukuran === 'sedang' ? 26 : 20, '--tunda': `${tunda}ms` }}>
          {data.jam || t.jamOpsional}
        </span>
        <span className="garis-isi" style={{ ...s.slotGaris, '--tunda': `${tunda + 120}ms` }} />
      </div>
    )
  }

  const bungkus = (h, isi, kelas, gaya, tunda) => {
    const selesai = Boolean(h.data.selesai)
    return (
      <div key={h.key} className={kelas} style={{ ...gaya, '--tunda': `${tunda}ms` }}>
        <SwipeableCheck selesai={selesai} onToggle={(v) => onTandaiSelesai?.(h.key, v)}>
          <div style={{ ...s.kartu, ...(selesai ? s.kartuSelesai : null) }}>
            {selesai && <span style={s.badgeSelesai} aria-hidden="true">✓</span>}
            <div style={{ opacity: selesai ? 0.55 : 1, height: '100%', transition: 'opacity 0.25s ease' }}>{isi}</div>
          </div>
        </SwipeableCheck>
      </div>
    )
  }

  // tempat penanda selalu disisakan supaya judul hari di kartu bersebelahan sejajar
  const penandaHariIni = (h, sisakan = true) => (h.i === hariIni ? <span style={s.hariIni}>{teksHariIni}</span> : sisakan ? <span style={s.hariIniKosong} /> : null)

  // 1 hari: kartu besar memenuhi layar
  if (hari.length === 1) {
    const h = hari[0]
    return (
      <div style={s.wrap}>
        {bungkus(h, (
          <div style={s.heroIsi}>
            {penandaHariIni(h)}
            <div className="denyut-titik" style={s.heroEyebrow}><i style={s.titikKecil} />{ringkasan}</div>
            <div style={s.heroHari}>{t.hariLabel[h.i]}</div>
            <div style={s.heroSlot}>
              {slot('antar', h.data.antar, 'besar', 200)}
              {slot('jemput', h.data.jemput, 'besar', 360)}
            </div>
          </div>
        ), 'kartu-pop', { minHeight: 300 }, 0)}
      </div>
    )
  }

  // 2 hari: dua kolom tinggi yang masuk dari dua sisi
  if (hari.length === 2) {
    return (
      <div style={{ ...s.wrap, ...s.dua }}>
        {hari.map((h, n) => bungkus(h, (
          <div style={s.kolomIsi}>
            {penandaHariIni(h)}
            <div style={s.kolomHari}>{t.hariLabel[h.i]}</div>
            <div style={s.pemisah} />
            <div style={s.kolomSlot}>
              {slot('antar', h.data.antar, 'sedang', 260 + n * 120)}
              {slot('jemput', h.data.jemput, 'sedang', 380 + n * 120)}
            </div>
          </div>
        ), n === 0 ? 'masuk-kiri' : 'masuk-kanan', { minHeight: 260 }, 0))}
      </div>
    )
  }

  // 3 hari: garis waktu tegak dengan titik tiap hari
  if (hari.length === 3) {
    return (
      <div style={s.wrap}>
        <div style={s.rel}>
          <span className="rel-tumbuh" style={s.relGaris} />
          {hari.map((h, n) => (
            <div key={h.key} className="masuk-kanan" style={{ ...s.relBaris, '--tunda': `${150 + n * 170}ms` }}>
              <span className="titik-timbul" style={{ ...s.relTitik, '--tunda': `${150 + n * 170}ms` }} />
              <div style={s.relKartu}>
                {bungkus(h, (
                  <div style={s.relIsi}>
                    <div style={s.relHari}>{t.hariLabel[h.i]}{penandaHariIni(h, false)}</div>
                    <div style={s.relSlot}>
                      {slot('antar', h.data.antar, 'kecil', 320 + n * 170)}
                      {slot('jemput', h.data.jemput, 'kecil', 420 + n * 170)}
                    </div>
                  </div>
                ), undefined, null, 0)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 4 hari: kotak 2x2 dengan strip ringkasan di atas
  return (
    <div style={s.wrap}>
      <div className="masuk-kiri" style={s.strip}>{ringkasan}</div>
      <div style={s.empat}>
        {hari.map((h, n) => bungkus(h, (
          <div style={s.kotakIsi}>
            <div style={s.kotakAtas}>
              <span style={s.kotakNomor}>{String(n + 1).padStart(2, '0')}</span>
              {penandaHariIni(h, false)}
            </div>
            <div style={s.kotakHari}>{t.hariLabel[h.i]}</div>
            <div style={s.kotakSlot}>
              {slot('antar', h.data.antar, 'kecil', 300 + n * 110)}
              {slot('jemput', h.data.jemput, 'kecil', 380 + n * 110)}
            </div>
          </div>
        ), 'kartu-pop', { '--urut': n }, n * 110))}
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  kartu: { position: 'relative', background: 'var(--panel)', boxShadow: 'inset 0 0 0 1px var(--garis)', height: '100%', boxSizing: 'border-box', transition: 'box-shadow 0.25s ease, opacity 0.25s ease' },
  kartuSelesai: { boxShadow: 'inset 0 0 0 1px var(--glow-blue)' },
  badgeSelesai: { position: 'absolute', top: 6, right: 6, width: 14, height: 14, background: 'var(--glow-blue)', color: '#08130d', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  hariIni: { fontSize: 9, letterSpacing: '0.12em', fontWeight: 700, color: '#04192A', background: '#FF9A3C', padding: '2px 6px', alignSelf: 'flex-start', height: 16, boxSizing: 'border-box', lineHeight: '12px' },
  hariIniKosong: { height: 16, display: 'block' },
  titikKecil: { width: 6, height: 6, background: 'var(--glow-blue)', display: 'inline-block' },

  slot: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 6, minWidth: 0 },
  slotBesar: { flex: 1 },
  slotLabel: { fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--glow-blue)', fontWeight: 700 },
  slotJam: { fontFamily: 'var(--font-data)', color: 'var(--text)', lineHeight: 1.1, letterSpacing: '0.02em' },
  slotGaris: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'var(--glow-blue)', transformOrigin: 'left' },

  heroIsi: { display: 'flex', flexDirection: 'column', gap: 10, padding: '22px 20px 24px', minHeight: 300, boxSizing: 'border-box', justifyContent: 'space-between' },
  heroEyebrow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.14em', color: 'var(--text-dim)' },
  heroHari: { fontFamily: 'var(--font-judul)', fontSize: 56, lineHeight: 1, letterSpacing: '1px', color: '#fff', textShadow: '0 0 14px rgba(94, 208, 255, 0.55)' },
  heroSlot: { display: 'flex', gap: 18 },

  dua: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  kolomIsi: { display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 14px 20px', minHeight: 260, boxSizing: 'border-box' },
  kolomHari: { fontFamily: 'var(--font-judul)', fontSize: 30, lineHeight: 1.05, letterSpacing: '1px', color: '#fff', textShadow: '0 0 10px rgba(94, 208, 255, 0.45)' },
  pemisah: { height: 2, background: 'var(--garis)' },
  kolomSlot: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 'auto' },

  rel: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 26 },
  relGaris: { position: 'absolute', left: 6, top: 10, bottom: 10, width: 2, background: 'var(--glow-blue)', opacity: 0.6, transformOrigin: 'top' },
  relBaris: { position: 'relative' },
  relTitik: { position: 'absolute', left: -26, top: 22, width: 14, height: 14, background: 'var(--bg)', border: '2px solid var(--glow-blue)', boxSizing: 'border-box' },
  relKartu: { minWidth: 0 },
  relIsi: { display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px 16px' },
  relHari: { display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-judul)', fontSize: 26, letterSpacing: '1px', color: '#fff', lineHeight: 1.1 },
  relSlot: { display: 'flex', gap: 22 },

  strip: { fontSize: 11, letterSpacing: '0.16em', color: 'var(--glow-blue)', fontWeight: 700, padding: '6px 10px', background: 'rgba(94, 208, 255, 0.08)', borderLeft: '3px solid var(--glow-blue)' },
  empat: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  kotakIsi: { display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 12px 14px', minHeight: 190, boxSizing: 'border-box' },
  kotakAtas: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 16 },
  kotakNomor: { fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' },
  kotakHari: { fontFamily: 'var(--font-judul)', fontSize: 22, lineHeight: 1.1, letterSpacing: '1px', color: '#fff' },
  kotakSlot: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' },
}
