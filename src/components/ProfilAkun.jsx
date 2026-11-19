import { WARNA_GLOW_PRESET, ambilWarnaGlow } from '../lib/warnaGlow'

// Kartu profil di tab Akun (penumpang dan ojek): foto besar dengan sudut siku warna glow, nama, lalu pilihan
// karakter dan warna glow yang langsung bisa diketuk di halaman (tanpa modal). Pilihan tersimpan seketika.
export default function ProfilAkun({ nama, peran, ikon, pilihanIkon, onPilihIkon, warnaKey, onPilihWarna, t }) {
  const warna = ambilWarnaGlow(warnaKey)
  const a = warna.utama
  return (
    <section style={s.kartu}>
      <div style={s.profil}>
        <div style={{ ...s.foto, border: `1px solid ${a}`, boxShadow: `0 0 14px ${a}55` }}>
          <img src={`/icons/${ikon}`} style={s.fotoImg} alt="" />
          <Siku warna={a} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={s.masuk}>{t.masukSebagai}</div>
          <div style={s.nama}>{nama}</div>
          {peran && <div style={{ ...s.peran, color: a }}>{peran}</div>}
        </div>
      </div>

      <div style={{ ...s.judul, color: a }}>{t.akunKarakter}</div>
      <div style={s.thumbRow} role="radiogroup" aria-label={t.akunKarakter}>
        {pilihanIkon.map((nm) => {
          const aktif = nm === ikon
          return (
            <button
              key={nm}
              type="button"
              role="radio"
              aria-checked={aktif}
              className="tekan"
              style={{ ...s.thumb, borderColor: aktif ? a : 'rgba(96,192,240,0.3)', boxShadow: aktif ? `0 0 10px ${a}55` : 'none' }}
              onClick={() => onPilihIkon(nm)}
            >
              <img src={`/icons/${nm}`} style={s.thumbImg} alt="" />
              {aktif && <Siku warna={a} kecil />}
            </button>
          )
        })}
      </div>

      <div style={{ ...s.judul, color: a }}>
        {t.akunWarna} <span style={{ color: '#E8EDF9', marginLeft: 8 }}>{warna.nama.toUpperCase()}</span>
      </div>
      <div style={s.swatchRow} role="radiogroup" aria-label={t.akunWarna}>
        {Object.entries(WARNA_GLOW_PRESET).map(([key, w]) => {
          const aktif = key === warnaKey
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={aktif}
              aria-label={w.nama}
              className="tekan"
              style={{ ...s.swatch, background: `linear-gradient(160deg, ${w.utama}, ${w.kuat})`, outline: aktif ? '2px solid #fff' : 'none', outlineOffset: 2 }}
              onClick={() => onPilihWarna(key)}
            >
              {aktif && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#05202F" strokeWidth="3.2" strokeLinecap="square" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Siku({ warna, kecil = false }) {
  const uk = kecil ? 7 : 10
  const b = `2px solid ${warna}`
  const dasar = { position: 'absolute', width: uk, height: uk, pointerEvents: 'none' }
  return (
    <>
      <span style={{ ...dasar, left: -1, top: -1, borderTop: b, borderLeft: b }} />
      <span style={{ ...dasar, right: -1, top: -1, borderTop: b, borderRight: b }} />
      <span style={{ ...dasar, left: -1, bottom: -1, borderBottom: b, borderLeft: b }} />
      <span style={{ ...dasar, right: -1, bottom: -1, borderBottom: b, borderRight: b }} />
    </>
  )
}

const s = {
  kartu: { background: 'var(--card-blue)', border: '1px solid var(--blue-border)', borderRadius: 0, padding: 18 },
  profil: { display: 'flex', alignItems: 'center', gap: 16 },
  foto: { position: 'relative', flexShrink: 0, width: 92, height: 92, background: '#011A29', overflow: 'hidden' },
  fotoImg: { width: '100%', height: '100%', objectFit: 'contain', objectPosition: '50% 20%', transform: 'scale(1.1) translateY(10px)', imageRendering: 'pixelated' },
  masuk: { fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.14em', color: '#9FC3E8', textTransform: 'uppercase' },
  nama: { fontFamily: 'var(--font-judul)', fontSize: 28, letterSpacing: 1, color: '#fff', lineHeight: 1.1 },
  peran: { fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.12em', marginTop: 2, textTransform: 'uppercase' },
  judul: { fontFamily: 'var(--font-data)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '20px 0 10px' },
  thumbRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  thumb: { position: 'relative', width: 64, height: 64, padding: 0, background: '#011A29', border: '1px solid', borderRadius: 0, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'contain', objectPosition: '50% 20%', transform: 'scale(1.1) translateY(8px)', imageRendering: 'pixelated', pointerEvents: 'none' },
  swatchRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  swatch: { width: 38, height: 38, padding: 0, border: 'none', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
}
