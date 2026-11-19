import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { WARNA_GLOW_PRESET, ambilWarnaGlow } from '../lib/warnaGlow'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

// Kartu profil di tab Akun (penumpang dan ojek): foto besar dengan sudut siku warna glow dan nama.
// Ketuk foto untuk membuka pop up ganti karakter (digeser kiri-kanan) dan warna glow.
export default function ProfilAkun({ nama, peran, ikon, pilihanIkon, onPilihIkon, warnaKey, onPilihWarna, t }) {
  const [buka, setBuka] = useState(false)
  const warna = ambilWarnaGlow(warnaKey)
  const a = warna.utama
  return (
    <>
      <section style={{ ...s.kartu, background: `linear-gradient(100deg, ${a}33, var(--card-blue) 62%)` }}>
        <button type="button" className="tekan" style={s.tombolFoto} onClick={() => setBuka(true)} aria-label={t.gantiFoto}>
          <span style={s.potong}>
            <img src={`/icons/${ikon}`} style={s.fotoImg} alt="" />
          </span>
        </button>
        <div style={s.teksBlok}>
          <div style={s.masuk}>{t.masukSebagai}</div>
          <div style={s.nama}>{nama}</div>
          {peran && <div style={{ ...s.peran, color: a }}>{peran}</div>}
        </div>
        <button type="button" className="tekan" style={{ ...s.ubah, color: a, borderColor: a }} onClick={() => setBuka(true)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true">
            <path d="M17 3l4 4L7.5 20.5 2 22l1.5-5.5z" />
          </svg>
          {t.akunUbah}
        </button>
        <span style={{ ...s.garis, background: a, boxShadow: `0 0 10px ${a}` }} />
      </section>

      {buka && (
        <PopupGanti
          ikon={ikon}
          pilihanIkon={pilihanIkon}
          warnaKey={warnaKey}
          onPilihWarna={onPilihWarna}
          onBatal={() => setBuka(false)}
          onSimpan={async (nm) => {
            if (nm !== ikon) await onPilihIkon(nm)
            setBuka(false)
          }}
          t={t}
        />
      )}
    </>
  )
}

function PopupGanti({ ikon, pilihanIkon, warnaKey, onPilihWarna, onBatal, onSimpan, t }) {
  useLockBodyScroll()
  const awal = Math.max(0, pilihanIkon.indexOf(ikon))
  const [halaman, setHalaman] = useState(awal)
  const sentuhAwal = useRef(null)
  const a = ambilWarnaGlow(warnaKey).utama
  const jumlah = pilihanIkon.length

  useEffect(() => {
    const tutup = (e) => { if (e.key === 'Escape') onBatal() }
    window.addEventListener('keydown', tutup)
    return () => window.removeEventListener('keydown', tutup)
  }, [onBatal])

  const geser = (d) => setHalaman((h) => Math.max(0, Math.min(h + d, jumlah - 1)))
  const sentuhMulai = (e) => { sentuhAwal.current = e.touches[0].clientX }
  const sentuhSelesai = (e) => {
    if (sentuhAwal.current === null) return
    const selisih = sentuhAwal.current - e.changedTouches[0].clientX
    if (selisih > 40) geser(1)
    else if (selisih < -40) geser(-1)
    sentuhAwal.current = null
  }

  return createPortal(
    <div style={s.overlay} onClick={onBatal}>
      <div style={{ ...s.sheet, borderTop: `2px solid ${a}` }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t.gantiFoto}>
        <div style={s.sheetJudul}>{t.gantiFoto}</div>

        <div style={s.karusel}>
          <button type="button" className="tekan" style={{ ...s.panah, color: a, opacity: halaman === 0 ? 0.25 : 1 }} onClick={() => geser(-1)} disabled={halaman === 0} aria-label="Sebelumnya">
            <Panah arah="kiri" />
          </button>
          <div style={s.viewport} onTouchStart={sentuhMulai} onTouchEnd={sentuhSelesai}>
            <div style={{ ...s.track, width: `${jumlah * 100}%`, transform: `translateX(-${halaman * (100 / jumlah)}%)` }}>
              {pilihanIkon.map((nm) => (
                <div key={nm} style={{ ...s.slot, width: `${100 / jumlah}%` }}>
                  <div style={{ ...s.bingkai, border: `1px solid ${a}`, boxShadow: `0 0 22px ${a}66` }}>
                    <img src={`/icons/${nm}`} style={s.bingkaiImg} alt="" />
                    <Siku warna={a} besar />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="button" className="tekan" style={{ ...s.panah, color: a, opacity: halaman === jumlah - 1 ? 0.25 : 1 }} onClick={() => geser(1)} disabled={halaman === jumlah - 1} aria-label="Berikutnya">
            <Panah arah="kanan" />
          </button>
        </div>

        <div style={s.titikRow} aria-hidden="true">
          {pilihanIkon.map((nm, i) => (
            <span key={nm} style={{ ...s.titik, width: i === halaman ? 18 : 6, background: i === halaman ? a : '#3F566E' }} />
          ))}
        </div>

        <div style={{ ...s.warnaJudul, color: a }}>
          {t.akunWarna} <span style={{ color: '#E8EDF9', marginLeft: 8 }}>{ambilWarnaGlow(warnaKey).nama.toUpperCase()}</span>
        </div>
        <div style={s.warnaRow} role="radiogroup" aria-label={t.akunWarna}>
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

        <div style={s.tombolRow}>
          <button type="button" className="tekan" style={s.batalBtn} onClick={onBatal}>{t.batal}</button>
          <button type="button" className="tekan" style={{ ...s.simpanBtn, background: a }} onClick={() => onSimpan(pilihanIkon[halaman])}>{t.akunSimpan}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Panah({ arah }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
      <path d={arah === 'kiri' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

function Siku({ warna, besar = false }) {
  const uk = besar ? 14 : 10
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
  kartu: { position: 'relative', marginTop: 46, minHeight: 100, border: '1px solid var(--blue-border)', borderRadius: 0, padding: '0 14px 0 140px', display: 'flex', alignItems: 'center' },
  tombolFoto: { position: 'absolute', left: 10, bottom: 0, width: 116, height: 146, padding: 0, background: 'transparent', border: 'none', borderRadius: 0 },
  potong: { position: 'absolute', inset: 0, overflow: 'hidden', clipPath: 'inset(0 0 2px 0)' },
  fotoImg: { position: 'absolute', left: -14, top: 0, width: 150, height: 150, objectFit: 'contain', objectPosition: '50% 0%', imageRendering: 'pixelated', pointerEvents: 'none' },
  teksBlok: { minWidth: 0, padding: '14px 0' },
  ubah: { position: 'absolute', right: 10, top: 10, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 8px', background: 'rgba(1,26,41,0.7)', border: '1px solid', borderRadius: 0, fontFamily: 'var(--font-data)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' },
  garis: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, pointerEvents: 'none' },
  masuk: { fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.14em', color: '#9FC3E8', textTransform: 'uppercase' },
  nama: { fontFamily: 'var(--font-judul)', fontSize: 28, letterSpacing: 1, color: '#fff', lineHeight: 1.1 },
  peran: { fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.12em', marginTop: 2, textTransform: 'uppercase' },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    justifyContent: 'center',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    padding: 'max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom))',
    zIndex: 9999,
  },
  sheet: {
    margin: 'auto',
    width: '100%',
    maxWidth: 360,
    boxSizing: 'border-box',
    background: 'var(--panel)',
    border: '1px solid var(--blue-border)',
    borderRadius: 0,
    padding: '18px 18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  sheetJudul: { fontFamily: 'var(--font-judul)', fontSize: 24, letterSpacing: 1, color: '#fff', textAlign: 'center' },
  karusel: { display: 'flex', alignItems: 'center', gap: 6 },
  panah: { flexShrink: 0, width: 38, height: 38, background: 'transparent', border: '1px solid rgba(96,192,240,0.45)', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  viewport: { flex: 1, overflow: 'hidden', touchAction: 'pan-y' },
  track: { display: 'flex', transition: 'transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)' },
  slot: { flexShrink: 0, display: 'flex', justifyContent: 'center', padding: '14px 0', boxSizing: 'border-box' },
  bingkai: { position: 'relative', width: 128, height: 128, background: '#011A29', borderRadius: 0 },
  bingkaiImg: { width: '100%', height: '100%', objectFit: 'contain', objectPosition: '50% 20%', transform: 'scale(1.1) translateY(12px)', imageRendering: 'pixelated' },
  titikRow: { display: 'flex', justifyContent: 'center', gap: 6, marginTop: -4 },
  titik: { height: 6, transition: 'width 0.2s, background 0.2s' },
  warnaJudul: { fontFamily: 'var(--font-data)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center', marginTop: 4 },
  warnaRow: { display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  swatch: { width: 38, height: 38, padding: 0, border: 'none', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tombolRow: { display: 'flex', gap: 10, marginTop: 6 },
  batalBtn: { flex: 1, padding: 13, background: 'transparent', border: '1px solid rgba(96,192,240,0.45)', borderRadius: 0, color: '#B0BAD6', fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' },
  simpanBtn: { flex: 1.4, padding: 13, border: 'none', borderRadius: 0, color: '#05202F', fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' },
}
