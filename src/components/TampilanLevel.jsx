import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { hitungLevel, uangPerLevel, tingkatPiala, TRIP_DEKAT } from '../lib/level'
import { playGeserTik, playLunasSemua, playGoBuka } from '../lib/sound'
import { getar, POLA_GETAR } from '../lib/getar'

const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID')

function teksSisa(lang, lv) {
  const tujuan = lv.level + 1
  if (lv.sisaTrip <= TRIP_DEKAT) {
    return {
      dekat: true,
      teks: lang === 'en' ? `${lv.sisaTrip} MORE TRIP${lv.sisaTrip > 1 ? 'S' : ''} TO LV ${tujuan}!` : `${lv.sisaTrip} TRIP LAGI KE LV ${tujuan}!`,
    }
  }
  return {
    dekat: false,
    teks: lang === 'en'
      ? `${rp(lv.sisa)} MORE TO LV ${tujuan} (${lv.sisaTrip} TRIPS)`
      : `${rp(lv.sisa)} LAGI KE LV ${tujuan} (${lv.sisaTrip} TRIP)`,
  }
}

// Angka rupiah berputar dari `dari` ke `ke` langsung di elemen (tanpa render ulang tiap frame)
function putarAngka(el, dari, ke, ms) {
  if (!el) return
  const t0 = performance.now()
  const langkah = (t) => {
    const p = Math.min(1, (t - t0) / ms)
    el.textContent = rp(dari + (ke - dari) * (1 - Math.pow(1 - p, 3)))
    if (p < 1) requestAnimationFrame(langkah)
  }
  requestAnimationFrame(langkah)
}

// Kotak-kotak piksel memercik dari satu titik (dipakai saat naik level)
function percik(wadah, x, y, lebar = 160) {
  if (!wadah) return
  for (let n = 0; n < 16; n++) {
    const warna = ['#FFD45E', '#5ED0FF', '#FFFFFF'][n % 3]
    const kotak = document.createElement('i')
    kotak.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:4px;height:4px;background:${warna};box-shadow:0 0 4px ${warna}`
    wadah.appendChild(kotak)
    const dx = (Math.random() - 0.3) * lebar
    const dy = -8 - Math.random() * 24
    kotak.animate(
      [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${dx * 1.2}px,${dy + 40}px)`, opacity: 0 },
      ],
      { duration: 900, easing: 'ease-out', fill: 'forwards' },
    ).onfinish = () => kotak.remove()
  }
}

// Warna piala per tingkat level: [badan, kilap, alas]
const WARNA_PIALA = {
  emas: ['#FFD84A', '#FFF4B0', '#C99A12'],
  perak: ['#D7DEE4', '#FFFFFF', '#8B98A3'],
  perunggu: ['#CD7F32', '#F0B47A', '#8A4F1C'],
}

// Layar kedua setelah naik level: piala besar (warna sesuai tingkat) memantul masuk di kiri; di kanan total uang
// berputar sampai angka yang baru dicapai (misalnya Rp3.500.000), lalu berkedip kuning dengan tulisan YOU REACHED.
// Ketuk di mana saja untuk lanjut.
function LayarPiala({ awal, akhir, lang, onLanjut }) {
  const refPiala = useRef(null)
  const refAngka = useRef(null)
  const refPercik = useRef(null)
  const [sampai, setSampai] = useState(false)
  const [badan, kilap, alas] = WARNA_PIALA[tingkatPiala(akhir.level)]

  useEffect(() => {
    const kurangGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    refPiala.current?.animate(
      [
        { transform: 'translateY(-30px) scale(0.6)', opacity: 0 },
        { transform: 'translateY(3px) scale(1.1)', opacity: 1, offset: 0.6 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: kurangGerak ? 1 : 600, easing: 'ease-out', fill: 'forwards' },
    )
    playGoBuka()
    getar(10)
    const t1 = setTimeout(() => putarAngka(refAngka.current, awal.total, awal.target, kurangGerak ? 1 : 700), 400)
    const t2 = setTimeout(() => {
      setSampai(true)
      if (refAngka.current) refAngka.current.textContent = rp(awal.target)
      if (!kurangGerak) {
        refAngka.current?.animate([{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }], { duration: 500 })
        percik(refPercik.current, 26, 22, 220)
      }
      getar(POLA_GETAR.kaget)
    }, 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lanjut = () => onLanjut?.()
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={lanjut}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lanjut() } }}
      aria-label={lang === 'en' ? `Level up to ${akhir.level}. Tap to continue` : `Naik ke level ${akhir.level}. Ketuk untuk lanjut`}
      style={s.layarPiala}
    >
      <svg ref={refPiala} width="56" height="51" viewBox="0 0 12 11" shapeRendering="crispEdges" aria-hidden="true" style={{ ...s.pialaBesar, filter: `drop-shadow(0 0 5px ${badan})` }}>
        <g fill={badan}>
          <rect x="2" y="1" width="8" height="4" /><rect x="3" y="5" width="6" height="1" /><rect x="5" y="6" width="2" height="3" /><rect x="3" y="9" width="6" height="2" />
          <rect x="0" y="1" width="2" height="1" /><rect x="0" y="2" width="1" height="2" /><rect x="10" y="1" width="2" height="1" /><rect x="11" y="2" width="1" height="2" />
        </g>
        <rect x="3" y="2" width="1" height="2" fill={kilap} />
        <rect x="3" y="9" width="6" height="1" fill={alas} />
      </svg>
      <div style={s.kananPiala}>
        <div style={{ ...s.kecilPiala, ...(sampai ? s.kuning : null) }}>{sampai ? (lang === 'en' ? 'YOU REACHED' : 'KAMU MENCAPAI') : 'TOTAL'}</div>
        <div ref={refAngka} style={{ ...s.angkaBesar, color: sampai ? '#FFD45E' : '#FFFFFF' }}>{rp(awal.total)}</div>
        <div style={s.barisPiala}>
          <span>LV <b style={s.lvKecil}>{sampai ? akhir.level : awal.level}</b></span>
          <span style={s.next}>NEXT {rp(akhir.target)}</span>
        </div>
      </div>
      <span className="level-tap" style={s.tap}>TAP ▸</span>
      <div ref={refPercik} style={s.percik} aria-hidden="true" />
    </div>
  )
}

// Tampilan level di konsol: "LV n", total uang sebenarnya dibanding target total level berikutnya (misalnya
// Rp3.120.000 / Rp3.500.000), garis kemajuan di level ini, lalu sisa ke level berikutnya.
// Kalau `dari` diisi (total sebelum perjalanan ini), garis dianimasikan dari nilai lama ke nilai baru. Kalau perjalanan
// ini membuat level naik, garis penuh, memercikkan kotak-kotak piksel, lalu level berganti.
export default function TampilanLevel({ total, dari = null, kananBawah = null, rapat = false, onLanjut = null, statistik = null }) {
  const { lang } = useLanguage()
  const { isDemo } = useAuth()
  const perLevel = uangPerLevel(isDemo)
  const akhir = hitungLevel(total, perLevel)
  const awal = dari == null ? akhir : hitungLevel(dari, perLevel)
  const naik = akhir.level > awal.level
  const [selesai, setSelesai] = useState(dari == null)
  // naik level: sesudah animasi garis, konsol pindah ke layar piala (ketuk untuk lanjut)
  const [layarPiala, setLayarPiala] = useState(false)
  const refIsi = useRef(null)
  const refUang = useRef(null)
  const refTarget = useRef(null)
  const refLv = useRef(null)
  const refTambah = useRef(null)
  const refPercik = useRef(null)
  const refWadah = useRef(null)

  useEffect(() => {
    if (dari == null) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setSelesai(true)
      if (naik) setLayarPiala(true)
      return undefined
    }
    const timer = []
    const nanti = (fn, ms) => timer.push(setTimeout(fn, ms))
    const isi = refIsi.current
    const tambah = refTambah.current
    tambah?.animate(
      [
        { opacity: 0, transform: 'translateY(4px)' },
        { opacity: 1, transform: 'none', offset: 0.3 },
        { opacity: 1, transform: 'translateY(-4px)', offset: 0.8 },
        { opacity: 0, transform: 'translateY(-8px)' },
      ],
      { duration: 1600, delay: 300, fill: 'forwards' },
    )

    if (!naik) {
      // Garis bertambah halus, angka rupiah ikut berputar
      nanti(() => {
        isi?.animate([{ transform: `scaleX(${awal.porsi})` }, { transform: `scaleX(${akhir.porsi})` }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' })
        putarAngka(refUang.current, awal.total, akhir.total, 700)
        getar(8)
        ;[0, 1, 2].forEach((i) => nanti(() => playGeserTik(i + 2), i * 120))
      }, 600)
      nanti(() => setSelesai(true), 1400)
    } else {
      // Naik level: garis penuh dulu, lalu percikan piksel dari ujungnya, level berganti, garis mulai dari awal lagi
      nanti(() => {
        isi?.animate([{ transform: `scaleX(${awal.porsi})` }, { transform: 'scaleX(1)' }], { duration: 400, fill: 'forwards' })
        putarAngka(refUang.current, awal.total, awal.target, 400)
      }, 600)
      nanti(() => {
        const wadah = refPercik.current
        const lebar = refWadah.current?.clientWidth || 300
        if (wadah) {
          for (let n = 0; n < 16; n++) {
            const warna = ['#FFD45E', '#5ED0FF', '#FFFFFF'][n % 3]
            const kotak = document.createElement('i')
            kotak.style.cssText = `position:absolute;left:${lebar - 4}px;top:28px;width:4px;height:4px;background:${warna};box-shadow:0 0 4px ${warna}`
            wadah.appendChild(kotak)
            const dx = -20 - Math.random() * Math.min(160, lebar * 0.6)
            const dy = -8 - Math.random() * 24
            kotak.animate(
              [
                { transform: 'translate(0,0)', opacity: 1 },
                { transform: `translate(${dx}px,${dy}px)`, opacity: 1, offset: 0.6 },
                { transform: `translate(${dx * 1.2}px,${dy + 40}px)`, opacity: 0 },
              ],
              { duration: 900, easing: 'ease-out', fill: 'forwards' },
            ).onfinish = () => kotak.remove()
          }
        }
        if (refLv.current) {
          refLv.current.textContent = String(akhir.level)
          refLv.current.animate([{ transform: 'scale(1.7)', color: '#FFD45E' }, { transform: 'scale(1)', color: '#FFFFFF' }], { duration: 500 })
        }
        isi?.animate([{ transform: 'scaleX(0)' }, { transform: `scaleX(${akhir.porsi})` }], { duration: 400, fill: 'forwards' })
        if (refTarget.current) refTarget.current.textContent = rp(akhir.target)
        putarAngka(refUang.current, awal.target, akhir.total, 400)
        playLunasSemua()
        getar(POLA_GETAR.senang)
      }, 1050)
      nanti(() => setSelesai(true), 1600)
      nanti(() => setLayarPiala(true), 2300)
    }
    return () => timer.forEach(clearTimeout)
    // animasi hanya sekali saat tampilan ini muncul
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (layarPiala) return <LayarPiala awal={awal} akhir={akhir} lang={lang} onLanjut={onLanjut} />

  const tampil = selesai ? akhir : awal
  const bawah = teksSisa(lang, akhir)
  const teksBawah = naik && selesai
    ? <span style={s.kuning}>{lang === 'en' ? `REACHED LV ${akhir.level}!` : `NAIK KE LV ${akhir.level}!`}</span>
    : !selesai && naik
      ? <span className="level-dekat">{teksSisa(lang, awal).teks}</span>
      : bawah.dekat ? <span className="level-dekat">{bawah.teks}</span> : bawah.teks

  return (
    <div ref={refWadah} style={s.wadah}>
      <div style={s.atas}>
        <span style={s.lvLabel}>LV <b ref={refLv} style={s.lv}>{tampil.level}</b></span>
        <span style={s.uang}><span ref={refUang}>{rp(tampil.total)}</span> / <span ref={refTarget}>{rp(tampil.target)}</span></span>
      </div>
      <div style={rapat ? { ...s.garis, margin: '5px 0 5px' } : s.garis}>
        <i ref={refIsi} style={{ ...s.isi, transform: `scaleX(${tampil.porsi})` }} />
        {dari != null && (
          <span ref={refTambah} style={{ ...s.tambah, left: `${awal.porsi * 100}%` }}>+{rp(total - dari)}</span>
        )}
      </div>
      {statistik ? (
        // halaman level di konsol: angka ringkas sejajar, kolom terakhir sisa trip ke level berikutnya (kuning berkedip saat dekat)
        <div style={s.statBaris}>
          {statistik.map(([nilai, label]) => (
            <span key={label} style={s.statItem}><span style={s.statNilai}>{nilai}</span><span style={s.statLabel}>{label}</span></span>
          ))}
          <span style={s.statItem}>
            <span className={bawah.dekat ? 'level-dekat' : undefined} style={s.statNilai}>{akhir.sisaTrip} TRIP</span>
            <span style={s.statLabel}>{lang === 'en' ? `LEFT TO LV ${akhir.level + 1}` : `LAGI KE LV ${akhir.level + 1}`}</span>
          </span>
        </div>
      ) : (
        <div style={s.bawah}>
          <span style={s.teksBawah}>{teksBawah}</span>
          {kananBawah}
        </div>
      )}
      <div ref={refPercik} style={s.percik} aria-hidden="true" />
    </div>
  )
}

const s = {
  wadah: { position: 'relative' },
  atas: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  lvLabel: { fontSize: 10, letterSpacing: '0.06em' },
  lv: { display: 'inline-block', fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: '#FFFFFF' },
  uang: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#FFFFFF', whiteSpace: 'nowrap' },
  garis: { position: 'relative', height: 4, margin: '8px 0 7px', background: 'rgba(94, 208, 255, 0.18)' },
  isi: { position: 'absolute', inset: 0, background: '#5ED0FF', boxShadow: '0 0 6px #5ED0FF', transformOrigin: 'left' },
  tambah: { position: 'absolute', top: -16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6CF29A', opacity: 0, whiteSpace: 'nowrap' },
  bawah: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 12 },
  teksBawah: { flex: 1, minWidth: 0, fontSize: 7, letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  kuning: { color: '#FFD45E', textShadow: '0 0 6px rgba(255, 212, 94, 0.6)' },
  statBaris: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 },
  statItem: { display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 },
  statNilai: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#FFFFFF', whiteSpace: 'nowrap' },
  statLabel: { fontSize: 5.5, letterSpacing: '0.12em', opacity: 0.6, whiteSpace: 'nowrap' },
  percik: { position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' },
  layarPiala: { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, height: 58, cursor: 'pointer', outline: 'none' },
  pialaBesar: { flexShrink: 0, opacity: 0 },
  kananPiala: { flex: 1, minWidth: 0 },
  kecilPiala: { fontSize: 7, letterSpacing: '0.16em' },
  angkaBesar: { fontFamily: "'JetBrains Mono', monospace", fontSize: 18, lineHeight: 1.15, whiteSpace: 'nowrap' },
  barisPiala: { display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 9, marginTop: 2 },
  lvKecil: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#FFFFFF' },
  next: { fontSize: 7, letterSpacing: '0.08em', opacity: 0.7, whiteSpace: 'nowrap' },
  tap: { position: 'absolute', right: 0, bottom: 0, fontSize: 8, letterSpacing: '0.1em', color: '#FFFFFF' },
}
