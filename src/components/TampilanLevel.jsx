import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { hitungLevel, uangPerLevel, TRIP_DEKAT } from '../lib/level'
import { playGeserTik, playLunasSemua } from '../lib/sound'
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

// Tampilan level di konsol: "LV n", total uang sebenarnya dibanding target total level berikutnya (misalnya
// Rp3.120.000 / Rp3.500.000), garis kemajuan di level ini, lalu sisa ke level berikutnya.
// Kalau `dari` diisi (total sebelum perjalanan ini), garis dianimasikan dari nilai lama ke nilai baru. Kalau perjalanan
// ini membuat level naik, garis penuh, memercikkan kotak-kotak piksel, lalu level berganti.
export default function TampilanLevel({ total, dari = null, kananBawah = null, rapat = false }) {
  const { lang } = useLanguage()
  const { isDemo } = useAuth()
  const perLevel = uangPerLevel(isDemo)
  const akhir = hitungLevel(total, perLevel)
  const awal = dari == null ? akhir : hitungLevel(dari, perLevel)
  const naik = akhir.level > awal.level
  const [selesai, setSelesai] = useState(dari == null)
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
    }
    return () => timer.forEach(clearTimeout)
    // animasi hanya sekali saat tampilan ini muncul
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <div style={s.bawah}>
        <span style={s.teksBawah}>{teksBawah}</span>
        {kananBawah}
      </div>
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
  percik: { position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' },
}
