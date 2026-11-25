import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { hitungLevel, uangPerLevel, tingkatPiala, TRIP_DEKAT } from '../lib/level'
import { playGeserTik, playLevelIsi, playLevelNaik, playPialaMasuk, playLevelTercapai, playLevelLanjut } from '../lib/sound'
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
// Mengembalikan fungsi untuk menghentikan putaran.
function putarAngka(el, dari, ke, ms) {
  if (!el) return () => {}
  const t0 = performance.now()
  let id = 0
  const langkah = (t) => {
    const p = Math.min(1, (t - t0) / ms)
    el.textContent = rp(dari + (ke - dari) * (1 - Math.pow(1 - p, 3)))
    if (p < 1) id = requestAnimationFrame(langkah)
  }
  id = requestAnimationFrame(langkah)
  return () => cancelAnimationFrame(id)
}

// Selama `aksi` diisi, ketukan di bagian mana pun layar info konsol (bukan hanya di atas elemennya) menjalankannya.
function useKetukKonsol(ref, aksi) {
  useEffect(() => {
    const area = ref.current?.closest('[data-konsol-info]')
    if (!area || !aksi) return undefined
    // ketukan di atas elemennya sendiri sudah ditangani onClick elemen itu
    const ketuk = (e) => { if (!ref.current?.contains(e.target)) aksi() }
    area.addEventListener('click', ketuk)
    return () => area.removeEventListener('click', ketuk)
  })
}

// Kotak-kotak piksel memercik dari satu titik (dipakai saat naik level). miring: 0,3 = ke kanan-kiri hampir rata,
// 1 = semuanya ke kiri (misalnya dari ujung kanan garis).
function percik(wadah, x, y, lebar = 160, jumlah = 16, miring = 0.3) {
  if (!wadah) return
  for (let n = 0; n < jumlah; n++) {
    const warna = ['#FFD45E', '#5ED0FF', '#FFFFFF'][n % 3]
    const kotak = document.createElement('i')
    const ukuran = n % 4 === 0 ? 5 : 4
    kotak.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${ukuran}px;height:${ukuran}px;background:${warna};box-shadow:0 0 4px ${warna}`
    wadah.appendChild(kotak)
    const dx = (Math.random() - miring) * lebar
    const dy = -10 - Math.random() * 30
    kotak.animate(
      [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx * 1.2}px,${dy + 44}px)`, opacity: 0 },
      ],
      { duration: 1100, easing: 'ease-out', fill: 'forwards' },
    ).onfinish = () => kotak.remove()
  }
}

// Dua cincin cahaya (cyan lalu kuning) melebar dari satu titik
function cincin(wadah, x, y) {
  if (!wadah) return
  for (let i = 0; i < 2; i++) {
    const cin = document.createElement('i')
    cin.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:30px;height:30px;margin:-15px 0 0 -15px;border:2px solid ${i ? '#FFD45E' : '#5ED0FF'};border-radius:50%`
    wadah.appendChild(cin)
    cin.animate([{ transform: 'scale(0.3)', opacity: 0.9 }, { transform: 'scale(5)', opacity: 0 }], { duration: 900, delay: i * 160, easing: 'ease-out', fill: 'both' }).onfinish = () => cin.remove()
  }
}

// Layar berkilat putih dua kali di atas seluruh app
function kilat() {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;background:#fff;opacity:0'
  ;(document.getElementById('root') || document.body).appendChild(el)
  el.animate([{ opacity: 0 }, { opacity: 0.7, offset: 0.15 }, { opacity: 0.1, offset: 0.4 }, { opacity: 0.45, offset: 0.55 }, { opacity: 0 }], { duration: 650 }).onfinish = () => el.remove()
}

function guncang(el) {
  el?.animate(
    [
      { transform: 'translate(0,0)' }, { transform: 'translate(-4px,2px)' }, { transform: 'translate(4px,-2px)' },
      { transform: 'translate(-3px,-1px)' }, { transform: 'translate(3px,1px)' }, { transform: 'translate(0,0)' },
    ],
    { duration: 400 },
  )
}

// Warna piala per tingkat level: [badan, kilap, alas]
const WARNA_PIALA = {
  emas: ['#FFD84A', '#FFF4B0', '#C99A12'],
  perak: ['#D7DEE4', '#FFFFFF', '#8B98A3'],
  perunggu: ['#CD7F32', '#F0B47A', '#8A4F1C'],
}

// Layar kedua setelah naik level: piala besar (warna sesuai tingkat) memantul masuk di kiri; di kanan total uang
// berputar sampai angka yang baru dicapai (misalnya Rp3.500.000), lalu berkedip kuning dengan tulisan YOU REACHED.
// Ketuk saat angka masih berputar untuk langsung ke hasil; ketuk sekali lagi untuk lanjut. langsung = tampil sudah di hasil.
function LayarPiala({ awal, akhir, lang, onLanjut, langsung = false }) {
  const refPiala = useRef(null)
  const refAngka = useRef(null)
  const refPercik = useRef(null)
  const refLvBesar = useRef(null)
  const refKanan = useRef(null)
  const refBlok = useRef(null)
  const refLewati = useRef(null)
  const refSampaiPada = useRef(0)
  const refLayar = useRef(null)
  const [sampai, setSampai] = useState(false)
  const [keluar, setKeluar] = useState(false)
  const [badan, kilap, alas] = WARNA_PIALA[tingkatPiala(akhir.level)]

  useEffect(() => {
    const kurangGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const timer = []
    const nanti = (fn, ms) => timer.push(setTimeout(fn, ms))
    refPiala.current?.animate(
      [
        { transform: 'translateY(-40px) scale(0.5)', opacity: 0 },
        { transform: 'translateY(4px) scale(1.15)', opacity: 1, offset: 0.65 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: kurangGerak ? 1 : 900, easing: 'ease-out', fill: 'forwards' },
    )
    playPialaMasuk()
    getar(10)
    // angka total berputar pelan sampai target, dengan tik-tik yang makin tinggi
    let hentikanPutar = () => {}
    nanti(() => {
      hentikanPutar = putarAngka(refAngka.current, awal.total, awal.target, kurangGerak ? 1 : 1500)
      if (!kurangGerak) for (let i = 0; i < 14; i++) nanti(() => playGeserTik(i % 9), i * 105)
    }, 900)
    const capai = () => {
      refSampaiPada.current = Date.now()
      setSampai(true)
      if (refAngka.current) refAngka.current.textContent = rp(awal.target)
      if (!kurangGerak) {
        refAngka.current?.animate([{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }], { duration: 600 })
        percik(refPercik.current, 28, 24, 320, 28)
        cincin(refPercik.current, 28, 26)
        refLvBesar.current?.animate([{ transform: 'scale(2.6)', color: '#FFD45E' }, { transform: 'scale(1)', color: '#FFFFFF' }], { duration: 700, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' })
        guncang(refPercik.current?.parentElement)
      }
      playLevelTercapai()
      getar(POLA_GETAR.senang)
    }
    nanti(capai, 2500)
    refLewati.current = () => {
      timer.forEach(clearTimeout)
      hentikanPutar()
      refPiala.current?.getAnimations().forEach((a) => a.finish())
      capai()
    }
    if (langsung) refLewati.current()
    return () => { timer.forEach(clearTimeout); hentikanPutar() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ketuk sebelum angka sampai melompat ke hasil; sesudahnya ketuk untuk lanjut (jeda pendek supaya ketukan dobel tidak
  // langsung menutup layar hasil). Ada suara dan animasi keluar: piala
  // melesat naik sambil memudar, teks bergeser ke kiri dan memudar, angka LEVEL membesar lalu hilang, percikan kecil.
  const lanjut = () => {
    if (keluar) return
    if (!sampai) { refLewati.current?.(); return }
    if (Date.now() - refSampaiPada.current < 350) return
    setKeluar(true)
    playLevelLanjut()
    getar(8)
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      refPiala.current?.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-20px) scale(1.3)', opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'forwards' })
      refKanan.current?.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(-16px)', opacity: 0 }], { duration: 360, delay: 40, easing: 'ease-in', fill: 'forwards' })
      refBlok.current?.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 380, delay: 60, easing: 'ease-in', fill: 'forwards' })
      percik(refPercik.current, 28, 26, 200, 12)
    }
    onLanjut?.()
  }
  useKetukKonsol(refLayar, lanjut)
  return (
    <div
      ref={refLayar}
      role="button"
      tabIndex={0}
      onClick={lanjut}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lanjut() } }}
      aria-label={lang === 'en' ? `Level up to ${akhir.level}. Tap to continue` : `Naik ke level ${akhir.level}. Ketuk untuk lanjut`}
      style={{ ...s.layarPiala, pointerEvents: keluar ? 'none' : 'auto' }}
    >
      <svg ref={refPiala} width="56" height="51" viewBox="0 0 12 11" shapeRendering="crispEdges" aria-hidden="true" style={{ ...s.pialaBesar, filter: `drop-shadow(0 0 5px ${badan})` }}>
        <g fill={badan}>
          <rect x="2" y="1" width="8" height="4" /><rect x="3" y="5" width="6" height="1" /><rect x="5" y="6" width="2" height="3" /><rect x="3" y="9" width="6" height="2" />
          <rect x="0" y="1" width="2" height="1" /><rect x="0" y="2" width="1" height="2" /><rect x="10" y="1" width="2" height="1" /><rect x="11" y="2" width="1" height="2" />
        </g>
        <rect x="3" y="2" width="1" height="2" fill={kilap} />
        <rect x="3" y="9" width="6" height="1" fill={alas} />
      </svg>
      <div ref={refKanan} style={s.kananPiala}>
        <div style={{ ...s.kecilPiala, ...(sampai ? s.kuning : null) }}>{sampai ? (lang === 'en' ? 'YOU REACHED' : 'KAMU MENCAPAI') : 'TOTAL'}</div>
        <div ref={refAngka} style={{ ...s.angkaBesar, color: sampai ? '#FFD45E' : '#FFFFFF' }}>{rp(awal.total)}</div>
        <div style={s.next}>NEXT {rp(akhir.target)}</div>
      </div>
      {/* blok kanan: angka level besar (membesar saat tercapai) dan TAP untuk lanjut */}
      <div ref={refBlok} style={s.blokLv}>
        <span style={s.kecilPiala}>LEVEL</span>
        <b ref={refLvBesar} style={s.lvBesar}>{sampai ? akhir.level : awal.level}</b>
        <span className="level-tap" style={{ ...s.tap, visibility: sampai ? 'visible' : 'hidden' }}>TAP ▸</span>
      </div>
      {/* partikel naik berulang sampai diketuk (hilang begitu keluar) */}
      {sampai && !keluar && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 14 }, (_, i) => (
            <i
              key={i}
              className="level-kembang"
              style={{ left: `${3 + i * 7}%`, background: ['#FFD45E', '#5ED0FF', '#FFFFFF'][i % 3], animationDelay: `${-(i * 0.17)}s`, animationDuration: `${1.4 + (i % 4) * 0.2}s`, '--dx': `${((i % 5) - 2) * 8}px` }}
            />
          ))}
        </div>
      )}
      <div ref={refPercik} style={s.percik} aria-hidden="true" />
    </div>
  )
}

// Tampilan level di konsol: "LV n", total uang sebenarnya dibanding target total level berikutnya (misalnya
// Rp3.120.000 / Rp3.500.000), garis kemajuan di level ini, lalu sisa ke level berikutnya.
// Kalau `dari` diisi (total sebelum perjalanan ini), garis dianimasikan dari nilai lama ke nilai baru. Kalau perjalanan
// ini membuat level naik, garis penuh, memercikkan kotak-kotak piksel, lalu level berganti.
export default function TampilanLevel({ total, dari = null, kananBawah = null, rapat = false, onLanjut = null, statistik = null, onKembali = null, tahan = false, onNaik = null }) {
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
  const refTimer = useRef([])
  const [dilewati, setDilewati] = useState(false)
  // naik level: garis yang masih bergerak bisa diketuk untuk langsung ke layar piala
  const bisaLewati = dari != null && naik
  const lewati = () => {
    refTimer.current.forEach(clearTimeout)
    onNaik?.()
    setDilewati(true)
    setLayarPiala(true)
  }

  useKetukKonsol(refWadah, bisaLewati && !layarPiala ? lewati : null)

  useEffect(() => {
    // tahan: garis diam di nilai lama selama animasi layar atas masih berjalan
    if (dari == null || tahan) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setSelesai(true)
      if (naik) { onNaik?.(); setLayarPiala(true) }
      return undefined
    }
    const timer = []
    refTimer.current = timer
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
      { duration: 1600, fill: 'forwards' },
    )

    if (!naik) {
      // Garis bertambah halus, angka rupiah ikut berputar
      nanti(() => {
        isi?.animate([{ transform: `scaleX(${awal.porsi})` }, { transform: `scaleX(${akhir.porsi})` }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' })
        putarAngka(refUang.current, awal.total, akhir.total, 700)
        getar(8)
        ;[0, 1, 2].forEach((i) => nanti(() => playGeserTik(i + 2), i * 120))
      }, 0)
      nanti(() => setSelesai(true), 800)
    } else {
      // Naik level, dibuat panjang supaya terasa: garis mengisi pelan sampai penuh (1,1 dtk) dengan nada naik. Saat penuh,
      // layar berkilat, konsol bergetar, kotak piksel dan cincin cahaya meledak dari ujung garis sambil fanfare, angka LV
      // berputar lalu mendarat di level baru, dan garis mulai lagi dari awal. Sesudahnya konsol pindah ke layar piala.
      nanti(() => {
        isi?.animate([{ transform: `scaleX(${awal.porsi})` }, { transform: 'scaleX(1)' }], { duration: 1100, easing: 'ease-in', fill: 'forwards' })
        putarAngka(refUang.current, awal.total, awal.target, 1100)
        playLevelIsi()
        getar([10, 40, 10, 40, 10, 40, 12])
      }, 0)
      nanti(() => {
        const wadah = refPercik.current
        const lebar = refWadah.current?.clientWidth || 300
        onNaik?.()
        kilat()
        guncang(refWadah.current)
        percik(wadah, lebar - 4, 28, lebar * 0.95, 32, 1)
        percik(wadah, lebar - 4, 28, 90, 12, 0.5)
        cincin(wadah, lebar - 4, 30)
        playLevelNaik()
        getar(POLA_GETAR.senang)
        const lvEl = refLv.current
        if (lvEl) {
          // angka LV berputar acak sekitar 0,7 dtk, lalu mendarat di level baru dengan membesar
          let putaran = 0
          const id = setInterval(() => {
            putaran += 1
            if (putaran >= 12) {
              clearInterval(id)
              lvEl.textContent = String(akhir.level)
              lvEl.animate([{ transform: 'scale(2.2)', color: '#FFD45E' }, { transform: 'scale(1)', color: '#FFFFFF' }], { duration: 650, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' })
            } else {
              lvEl.textContent = String(1 + Math.floor(Math.random() * 90))
            }
          }, 58)
          timer.push(id)
        }
      }, 1150)
      nanti(() => {
        isi?.animate([{ transform: 'scaleX(0)' }, { transform: `scaleX(${akhir.porsi})` }], { duration: 500, fill: 'forwards' })
        if (refTarget.current) refTarget.current.textContent = rp(akhir.target)
        putarAngka(refUang.current, awal.target, akhir.total, 500)
      }, 2150)
      nanti(() => setSelesai(true), 2700)
      nanti(() => setLayarPiala(true), 4200)
    }
    return () => timer.forEach(clearTimeout)
    // animasi hanya sekali, begitu tidak ditahan lagi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahan])

  if (layarPiala) return <LayarPiala awal={awal} akhir={akhir} lang={lang} onLanjut={onLanjut} langsung={dilewati} />

  const tampil = selesai ? akhir : awal
  const bawah = teksSisa(lang, akhir)
  const teksBawah = naik && selesai
    ? <span style={s.kuning}>{lang === 'en' ? `REACHED LV ${akhir.level}!` : `NAIK KE LV ${akhir.level}!`}</span>
    : !selesai && naik
      ? <span className="level-dekat">{teksSisa(lang, awal).teks}</span>
      : bawah.dekat ? <span className="level-dekat">{bawah.teks}</span> : bawah.teks

  return (
    <div
      ref={refWadah}
      style={bisaLewati ? { ...s.wadah, cursor: 'pointer' } : s.wadah}
      {...(bisaLewati ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': lang === 'en' ? 'Skip level up animation' : 'Lewati animasi naik level',
        onClick: lewati,
        onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lewati() } },
      } : null)}
    >
      <div style={s.atas}>
        <span style={s.lvGrup}>
          {onKembali && (
            <button type="button" onClick={onKembali} style={s.kembali} aria-label={lang === 'en' ? 'Back' : 'Kembali'}>◀</button>
          )}
          <span style={s.lvLabel}>LV <b ref={refLv} style={s.lv}>{tampil.level}</b></span>
        </span>
        <span style={s.uang}><span ref={refUang}>{rp(tampil.total)}</span><span style={s.target}> / <span ref={refTarget}>{rp(tampil.target)}</span></span></span>
      </div>
      <div style={statistik ? { ...s.garis, margin: '7px 0 8px' } : rapat ? { ...s.garis, margin: '5px 0 5px' } : s.garis}>
        <i ref={refIsi} style={{ ...s.isi, transform: `scaleX(${tampil.porsi})` }} />
        {dari != null && (
          <span ref={refTambah} style={s.tambah}>+{rp(total - dari)}</span>
        )}
      </div>
      {statistik ? (
        // halaman level di konsol: angka ringkas sejajar, kolom terakhir sisa trip ke level berikutnya (kuning berkedip saat dekat)
        <div style={s.statBaris}>
          {statistik.map(([nilai, label, warna]) => (
            <span key={label} style={s.statItem}><span style={{ ...s.statNilai, color: warna }}>{nilai}</span><span style={s.statLabel}>{label}</span></span>
          ))}
          <span style={s.statItem}>
            <span className={bawah.dekat ? 'level-dekat' : undefined} style={{ ...s.statNilai, color: '#FFD45E' }}>{akhir.sisaTrip} TRIP</span>
            <span style={s.statLabel}>{lang === 'en' ? `TO LV ${akhir.level + 1}` : `KE LV ${akhir.level + 1}`}</span>
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
  lvGrup: { display: 'inline-flex', alignItems: 'baseline', gap: 6 },
  // tombol kembali kecil; area sentuhnya diperluas dengan padding yang diimbangi margin negatif supaya tinggi baris tidak berubah
  kembali: { background: 'none', border: 'none', color: '#5ED0FF', font: 'inherit', fontSize: 9, padding: '8px 8px 8px 0', margin: '-8px 0 -8px 0', cursor: 'pointer', textShadow: '0 0 6px rgba(94, 208, 255, 0.5)' },
  target: { color: '#7FA6BF' },
  lvLabel: { fontSize: 10, letterSpacing: '0.06em', color: '#5ED0FF' },
  lv: { display: 'inline-block', fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: '#FFFFFF' },
  uang: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#FFFFFF', whiteSpace: 'nowrap' },
  garis: { position: 'relative', height: 4, margin: '8px 0 7px', background: 'rgba(94, 208, 255, 0.18)' },
  isi: { position: 'absolute', inset: 0, background: '#5ED0FF', boxShadow: '0 0 6px #5ED0FF', transformOrigin: 'left' },
  // di ruang kosong antara LV (kiri) dan total (kanan), jadi tidak menabrak keduanya dan tidak keluar layar
  tambah: { position: 'absolute', left: '34%', marginLeft: -28, top: -17, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#6CF29A', opacity: 0, whiteSpace: 'nowrap', textShadow: '0 0 6px rgba(108, 242, 154, 0.7)' },
  bawah: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 12 },
  teksBawah: { flex: 1, minWidth: 0, fontSize: 7, letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  kuning: { color: '#FFD45E', textShadow: '0 0 6px rgba(255, 212, 94, 0.6)' },
  statBaris: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  statItem: { display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 },
  statNilai: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#FFFFFF', whiteSpace: 'nowrap' },
  statLabel: { fontSize: 6, letterSpacing: '0.14em', opacity: 0.6, whiteSpace: 'nowrap', marginTop: 1 },
  percik: { position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' },
  layarPiala: { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, height: 58, cursor: 'pointer', outline: 'none' },
  pialaBesar: { flexShrink: 0, opacity: 0 },
  kananPiala: { flex: 1, minWidth: 0 },
  kecilPiala: { fontSize: 7, letterSpacing: '0.16em' },
  angkaBesar: { fontFamily: "'JetBrains Mono', monospace", fontSize: 18, lineHeight: 1.15, whiteSpace: 'nowrap' },
  next: { fontSize: 7, letterSpacing: '0.08em', opacity: 0.7, whiteSpace: 'nowrap', marginTop: 3 },
  blokLv: { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center', gap: 2, paddingLeft: 12, borderLeft: '1px solid rgba(94, 208, 255, 0.22)' },
  lvBesar: { display: 'inline-block', fontFamily: "'JetBrains Mono', monospace", fontSize: 26, lineHeight: 1, color: '#FFFFFF', textShadow: '0 0 8px rgba(94, 208, 255, 0.6)' },
  tap: { fontSize: 8, letterSpacing: '0.1em', color: '#FFFFFF', marginTop: 2 },
}
