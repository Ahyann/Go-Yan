import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { lihatAnimLevel, habisAnimLevel } from '../lib/animLevel'
import { formatRupiah } from '../lib/constants'
import { playEkspMasuk, playKoinRp, playLevelNaikKonsol } from '../lib/sound'
import { TEKS_STATUS, jenisCuaca, useStatusSiaga } from '../lib/statusSiaga'
import { JUMLAH_BAR, useBensin } from '../lib/bensin'
import { hitungLevel, tingkatPiala, uangPerLevel } from '../lib/level'
import { useAuth } from '../context/AuthContext.jsx'

const svg = { shapeRendering: 'crispEdges', style: { flexShrink: 0, display: 'block' } }

// Saat naik level, sisa garis sebelum penuh hanya beberapa persen (satu trip), nyaris tidak terlihat di garis selebar 46px.
// Karena itu animasinya mulai dari posisi yang lebih rendah supaya kenaikannya terasa.
const PORSI_AWAL_ANIM = 0.35
const JUMLAH_EMAS = 8 // butir emas yang masuk ke garis; tiap butir menaikkan garis satu langkah

export function IkonCuaca({ jenis }) {
  const awan = <g fill="#DCEBFF" className="ik-awan"><rect x="2" y="8" width="10" height="3" /><rect x="3" y="7" width="3" height="1" /><rect x="5" y="5" width="4" height="3" /><rect x="1" y="9" width="1" height="1" /></g>
  const matahari = (
    <>
      <rect x="8" y="1" width="4" height="4" fill="#FFD84A" />
      <g fill="#FFD84A" className="ik-sinar"><rect x="9" y="0" width="2" height="1" /><rect x="12" y="2" width="2" height="2" /><rect x="7" y="2" width="1" height="2" /><rect x="12" y="1" width="1" height="1" /></g>
    </>
  )
  const awanGelap = <g fill="#9FB7CC" className="ik-awan"><rect x="2" y="3" width="10" height="3" /><rect x="3" y="2" width="3" height="1" /><rect x="5" y="0" width="4" height="3" /><rect x="1" y="4" width="1" height="1" /></g>
  const tetes = (xs) => <g fill="#5ED0FF">{xs.map((x, i) => <rect key={x} className="ik-tetes" style={{ animationDelay: `${i * 0.22}s` }} x={x} y="7" width="1" height="2" />)}</g>
  return (
    <svg width="17" height="14" viewBox="0 0 14 12" aria-hidden="true" {...svg}>
      {jenis === 'cerah' && <><rect x="4" y="4" width="6" height="5" fill="#FFD84A" /><rect x="5" y="3" width="4" height="7" fill="#FFD84A" /><g fill="#FFD84A" className="ik-sinar"><rect x="6" y="0" width="2" height="2" /><rect x="6" y="11" width="2" height="1" /><rect x="1" y="5" width="2" height="2" /><rect x="11" y="5" width="2" height="2" /></g></>}
      {jenis === 'sebagian' && <>{matahari}{awan}</>}
      {jenis === 'mendung' && awan}
      {jenis === 'kabut' && <><g fill="#DCEBFF"><rect x="2" y="3" width="10" height="1" /><rect x="1" y="6" width="10" height="1" /><rect x="3" y="9" width="9" height="1" /></g></>}
      {(jenis === 'gerimis' || jenis === 'hujan') && <>{awanGelap}{tetes(jenis === 'hujan' ? [3, 6, 9, 12] : [4, 8])}</>}
      {jenis === 'petir' && <>{awan}<g fill="#FFD84A" className="ik-sinar"><rect x="6" y="9" width="2" height="1" /><rect x="5" y="10" width="2" height="1" /><rect x="6" y="11" width="1" height="1" /></g></>}
    </svg>
  )
}

// Pompa bensin piksel oranye
export function IkonPompa() {
  return (
    <svg width="14" height="16" viewBox="0 0 12 14" aria-hidden="true" {...svg}>
      <g fill="#FF9A3C"><rect x="1" y="1" width="7" height="12" /><rect x="0" y="13" width="9" height="1" /></g>
      <rect x="2" y="3" width="5" height="3" fill="#04192A" />
      <g fill="#FFFFFF"><rect x="8" y="4" width="2" height="1" /><rect x="10" y="4" width="1" height="6" /><rect x="9" y="9" width="1" height="1" /></g>
    </svg>
  )
}

// Kotak bar bensin seperti speedometer: padat = hampir pasti ada, bergaris berkedip = mungkin ada (perkiraan)
export function warnaBar(n) {
  return n <= 1 ? '#ED1C24' : n <= 2 ? '#FF9A3C' : '#4ADE80'
}

export function MeterBensin({ pasti = 0, mungkin = 0, lebar = 5, tinggi = 10, jarak = 2 }) {
  const warna = warnaBar(pasti || mungkin)
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', gap: jarak, alignItems: 'flex-end' }}>
      {Array.from({ length: JUMLAH_BAR }, (_, i) => (
        <i
          key={i}
          className={i >= pasti && i < mungkin ? 'bar-ragu' : undefined}
          style={{
            width: lebar,
            height: tinggi,
            display: 'block',
            background: i < pasti ? warna : i < mungkin ? `repeating-linear-gradient(135deg, ${warna} 0 2px, transparent 2px 4px)` : '#1E3A52',
          }}
        />
      ))}
    </span>
  )
}

// Warna piala per tingkat level: [badan, kilap, alas]
const WARNA_PIALA = {
  emas: ['#FFD84A', '#FFF4B0', '#C99A12'],
  perak: ['#D7DEE4', '#FFFFFF', '#8B98A3'],
  perunggu: ['#CD7F32', '#F0B47A', '#8A4F1C'],
}

// Piala piksel: kilap putih menyapu badan piala sesekali dan ada kilau kecil di pojok kanan atas. Warnanya mengikuti
// tingkat level (perunggu, perak, emas); tanpa level (akun penumpang) tetap emas.
function IkonTrip({ tingkat = 'emas' }) {
  const [badan, kilap, alas] = WARNA_PIALA[tingkat] || WARNA_PIALA.emas
  const bentuk = (
    <>
      <rect x="2" y="1" width="8" height="4" />
      <rect x="3" y="5" width="6" height="1" />
      <rect x="5" y="6" width="2" height="3" />
      <rect x="3" y="9" width="6" height="2" />
      <rect x="0" y="1" width="2" height="1" />
      <rect x="0" y="2" width="1" height="2" />
      <rect x="10" y="1" width="2" height="1" />
      <rect x="11" y="2" width="1" height="2" />
    </>
  )
  return (
    <svg width="17" height="16" viewBox="0 0 14 13" aria-hidden="true" {...svg}>
      <defs><clipPath id="ik-piala-klip">{bentuk}</clipPath></defs>
      <g fill={badan}>{bentuk}</g>
      <rect x="3" y="2" width="1" height="2" fill={kilap} />
      <rect x="3" y="9" width="6" height="1" fill={alas} />
      <g clipPath="url(#ik-piala-klip)">
        <g className="ik-kilap"><rect x="-1" y="0" width="2" height="12" fill="#FFFFFF" opacity="0.9" /><rect x="2" y="0" width="1" height="12" fill="#FFFFFF" opacity="0.5" /></g>
      </g>
      <g fill="#FFFFFF" className="ik-kilau"><rect x="12" y="0" width="1" height="3" /><rect x="11" y="1" width="3" height="1" /></g>
    </svg>
  )
}

// Baris di bawah jam konsol ojek saat siaga: cuaca, sinyal GPS, dan total trip, dengan ikon piksel.
export default function BarisStatusSiaga({ totalTrip = null, totalUang = null, lokasiAktif = false, onBukaCuaca = null, onBukaBensin = null, onBukaLevel = null }) {
  const { lang } = useLanguage()
  const { isDemo } = useAuth()
  const k = TEKS_STATUS[lang] || TEKS_STATUS.id
  const { cuaca } = useStatusSiaga(lokasiAktif)
  const bensin = useBensin()
  const jenis = cuaca ? jenisCuaca(cuaca.kode) : null

  const isiSlot = (ikon, nilai, label, panah = false) => (
    <>
      {ikon}
      <span style={s.teks}>
        <span style={s.nilai}>{nilai}{panah && <span aria-hidden="true" style={s.panah}> ›</span>}</span>
        <span style={s.label}>{label}</span>
      </span>
    </>
  )
  const slot = (ikon, nilai, label) => <span style={s.slot}>{isiSlot(ikon, nilai, label)}</span>
  const labelBensin = !bensin || bensin.perluSinkron ? (lang === 'en' ? 'SYNC?' : 'SINKRON?') : lang === 'en' ? 'FUEL' : 'BENSIN'
  const slotBensin = (
    <button
      type="button"
      className="slot-status"
      style={{ ...s.slot, ...s.tombolSlot }}
      onClick={onBukaBensin || undefined}
      aria-label={lang === 'en' ? `Fuel, about ${bensin ? Math.round(bensin.tengah) : '?'} of ${JUMLAH_BAR} bars` : `Bensin, sekitar ${bensin ? Math.round(bensin.tengah) : '?'} dari ${JUMLAH_BAR} bar`}
    >
      <IkonPompa />
      <span style={s.teks}>
        <span style={{ display: 'flex', alignItems: 'center', height: 12 }}>
          <MeterBensin pasti={bensin ? bensin.pasti : 0} mungkin={bensin ? bensin.mungkin : JUMLAH_BAR} />
          <span aria-hidden="true" style={{ ...s.panah, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, marginLeft: 5 }}>›</span>
        </span>
        <span style={{ ...s.label, ...(!bensin || bensin.perluSinkron ? { color: '#FF9A3C', opacity: 1 } : null) }}>{labelBensin}</span>
      </span>
    </button>
  )
  const lv = totalUang != null ? hitungLevel(totalUang, uangPerLevel(isDemo)) : null

  // Animasi level sesudah layar "KAMU MENCAPAI" diketuk: +Rp muncul, butir emas masuk ke garis dan tiap butir membuat
  // garis menyentak naik, lalu tulisan LEVEL UP!, lalu LV baru dengan bar mulai dari awal. Selama berjalan, tampilan memakai `tampil` (level lama lalu baru).
  const refSlot = useRef(null)
  const refPiala = useRef(null)
  const refTeks = useRef(null)
  const refGaris = useRef(null)
  const refIsi = useRef(null)
  const [anim] = useState(() => lihatAnimLevel())
  const [tampil, setTampil] = useState(() => (anim ? { level: anim.levelLama, porsi: Math.min(anim.porsiLama, PORSI_AWAL_ANIM), fase: 'isi' } : null))
  useEffect(() => {
    if (!anim) return undefined
    habisAnimLevel()
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setTampil(null)
      return undefined
    }
    const timer = []
    const dibuat = []
    const nanti = (fn, ms) => timer.push(setTimeout(fn, ms))
    const denyut = () => refPiala.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.45) rotate(-8deg)', offset: 0.3 }, { transform: 'scale(0.95)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 420 })
    const T0 = 600 // jeda sesudah konsol tampil (konsol menyala dari garis tipis dulu)
    const slot = refSlot.current
    const garis = refGaris.current
    const buat = (induk, gaya) => {
      const e = document.createElement('i')
      Object.assign(e.style, { position: 'absolute', pointerEvents: 'none', zIndex: 3, ...gaya })
      induk.appendChild(e)
      dibuat.push(e)
      return e
    }
    // garis menyentak: menebal sesaat, isinya menyala putih lalu emas, dan ada kilatan tegak di ujung isi
    const sentak = (porsi, kuat = 1) => {
      garis?.animate([{ transform: 'scaleY(2.2)' }, { transform: `scaleY(${2.2 + 2.2 * kuat})`, offset: 0.3 }, { transform: 'scaleY(1.9)', offset: 0.7 }, { transform: 'scaleY(2.2)' }], { duration: 200 })
      refIsi.current?.animate([
        { background: '#FFFFFF', boxShadow: '0 0 10px #FFD84A, 0 0 4px #FFFFFF' },
        { background: '#FFD84A', boxShadow: '0 0 9px #FFD84A', offset: 0.45 },
        { background: '#5ED0FF', boxShadow: '0 0 4px #5ED0FF' },
      ], { duration: 340 })
      if (!garis) return
      const kilat = buat(garis, { left: `calc(${porsi * 100}% - 1px)`, top: '-2px', width: '3px', height: '7px', background: '#FFFFFF', boxShadow: '0 0 8px #FFD84A, 0 0 4px #FFFFFF' })
      kilat.animate([{ transform: 'scaleY(0.6)', opacity: 1 }, { transform: `scaleY(${1.4 + kuat})`, opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' }).onfinish = () => kilat.remove()
    }
    // +Rp tarif trip muncul membal di atas piala (bunyi koin) dan bertahan selama butir emasnya masuk
    if (slot) {
      const uang = buat(slot, { left: '0px', top: '-12px', fontStyle: 'normal', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', fontSize: '12px', color: '#FFD84A', textShadow: '0 0 8px #FFD84A, 0 0 3px #000, 1px 1px 0 #000', whiteSpace: 'nowrap', opacity: 0 })
      uang.textContent = `+${formatRupiah(anim.tarif ?? 0)}`
      uang.animate([
        { transform: 'translateY(0) scale(0.6)', opacity: 0 },
        { transform: 'translateY(-8px) scale(1.25)', opacity: 1, offset: 0.18 },
        { transform: 'translateY(-16px) scale(1)', opacity: 1, offset: 0.85 },
        { transform: 'translateY(-26px) scale(0.85)', opacity: 0 },
      ], { duration: 2000, delay: T0, fill: 'both' })
      nanti(() => playKoinRp(), T0 + 100)
    }
    // butir emas terbang dari tulisan ke ujung isi garis; saat masuk, garis naik satu langkah dengan sentakan dan tik naik nada
    const awal = Math.min(anim.porsiLama, PORSI_AWAL_ANIM)
    for (let n = 0; n < JUMLAH_EMAS; n++) {
      const sebelum = awal + ((1 - awal) * n) / JUMLAH_EMAS
      const sesudah = awal + ((1 - awal) * (n + 1)) / JUMLAH_EMAS
      const berangkat = T0 + 500 + n * 160
      nanti(() => {
        if (!slot || !garis) return
        const x = 8 + ((n * 23) % 50)
        const dx = garis.offsetLeft + sebelum * garis.offsetWidth - x - 3
        const dy = garis.offsetTop + garis.offsetHeight / 2 + 10 - 3
        const butir = buat(slot, { left: `${x}px`, top: '-10px', width: '6px', height: '6px', background: '#FFD84A', boxShadow: '0 0 8px #FFD84A' })
        butir.animate([
          { transform: 'translate(0, 0) scale(1.2)' },
          { transform: `translate(${dx * 0.35}px, ${dy * 0.1 - 8}px) scale(1)`, offset: 0.4 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.6)` },
        ], { duration: 360, easing: 'ease-in', fill: 'forwards' }).onfinish = () => butir.remove()
      }, berangkat)
      nanti(() => {
        setTampil((p) => (p ? { ...p, porsi: sesudah, fase: 'tambah' } : p))
        playEkspMasuk(n)
        sentak(sesudah)
      }, berangkat + 360)
    }
    // penuh: sentakan besar, LEVEL UP! membal, jingle naik, piala berdenyut
    nanti(() => {
      setTampil((p) => (p ? { ...p, fase: 'naik' } : p))
      playLevelNaikKonsol()
      denyut()
      sentak(1, 1.6)
      requestAnimationFrame(() => refTeks.current?.animate([{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1.7)', opacity: 1, offset: 0.35 }, { transform: 'scale(1)' }], { duration: 600 }))
    }, T0 + 2350)
    // LV baru, bar kosong lalu terisi ke posisi sebenarnya
    nanti(() => setTampil({ level: anim.levelBaru, porsi: 0, fase: 'turun' }), T0 + 3650)
    nanti(() => { setTampil({ level: anim.levelBaru, porsi: anim.porsiBaru, fase: 'isi' }); denyut() }, T0 + 3750)
    nanti(() => setTampil(null), T0 + 4700)
    return () => { timer.forEach(clearTimeout); dibuat.forEach((e) => e.remove()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const levelTampil = tampil ? tampil.level : lv?.level
  const porsiTampil = tampil ? tampil.porsi : lv?.porsi
  const slotLevel = lv && (
    <button
      ref={refSlot}
      type="button"
      className="slot-status"
      style={{ ...s.slot, ...s.tombolSlot, position: 'relative' }}
      onClick={onBukaLevel || undefined}
      aria-label={lang === 'en' ? `Driver level ${lv.level}, ${Math.round(lv.porsi * 100)}% to the next level` : `Level ojek ${lv.level}, ${Math.round(lv.porsi * 100)}% ke level berikutnya`}
    >
      <span ref={refPiala} style={{ display: 'inline-flex' }}><IkonTrip tingkat={tingkatPiala(levelTampil)} /></span>
      {/* LV n di tempat angka trip, garis level tipis menggantikan tulisan TOTAL TRIPS */}
      <span style={s.teks}>
        {tampil?.fase === 'naik' ? (
          <span ref={refTeks} style={{ ...s.nilai, color: '#6CF29A', textShadow: '0 0 8px #6CF29A', letterSpacing: '0.02em' }}>LEVEL UP!</span>
        ) : (
          <span style={s.nilai}>LV {levelTampil}<span aria-hidden="true" style={s.panah}> ›</span></span>
        )}
        <span ref={refGaris} style={{ ...s.garisLevel, ...(tampil ? { transform: 'scaleY(2.2)', transformOrigin: 'left center' } : null) }}><i ref={refIsi} style={{ ...s.isiLevel, width: `${porsiTampil * 100}%`, transition: tampil?.fase === 'isi' ? 'width 0.9s ease-out' : tampil?.fase === 'tambah' ? 'width 0.14s ease-out' : 'none' }} /></span>
      </span>
    </button>
  )
  const slotTombol = (ikon, nilai, label, aria, onKlik) => (
    <button type="button" className="slot-status" style={{ ...s.slot, ...s.tombolSlot }} onClick={onKlik} aria-label={aria}>{isiSlot(ikon, nilai, label, true)}</button>
  )

  return (
    <div role="group" aria-label={`${cuaca ? `${cuaca.suhu}°, ${k.kode[jenis]}` : k.cuaca}; ${k.trip} ${totalTrip ?? '-'}`} style={s.baris}>
      {onBukaCuaca
        ? slotTombol(<IkonCuaca jenis={jenis || 'mendung'} />, cuaca ? `${cuaca.suhu}°` : '--°', jenis ? k.kode[jenis] : k.cuaca, lang === 'en' ? 'Open weather forecast' : 'Buka prakiraan cuaca', onBukaCuaca)
        : slot(<IkonCuaca jenis={jenis || 'mendung'} />, cuaca ? `${cuaca.suhu}°` : '--°', jenis ? k.kode[jenis] : k.cuaca)}
      {slotBensin}
      {onBukaLevel && totalUang != null ? slotLevel : slot(<IkonTrip />, totalTrip ?? '--', k.trip)}
    </div>
  )
}

const s = {
  // tiga kolom sama lebar, tiap slot di tengah kolomnya: jarak antarslot rata dan tidak menempel ke tepi konsol
  baris: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', justifyItems: 'center', alignItems: 'center', height: 26, borderTop: '1px solid rgba(94, 208, 255, 0.22)', paddingTop: 4 },
  slot: { display: 'inline-flex', alignItems: 'center', gap: 7 },
  tombolSlot: { background: 'none', border: 'none', padding: 0, margin: 0, color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' },
  panah: { color: '#5ED0FF' },
  teks: { display: 'flex', flexDirection: 'column', lineHeight: 1.05 },
  nilai: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.04em', color: '#FFFFFF', whiteSpace: 'nowrap' },
  label: { fontSize: 6, letterSpacing: '0.14em', opacity: 0.6, whiteSpace: 'nowrap', marginTop: 1 },
  garisLevel: { position: 'relative', display: 'block', width: 46, height: 3, marginTop: 3, background: 'rgba(94, 208, 255, 0.18)' },
  isiLevel: { position: 'absolute', left: 0, top: 0, bottom: 0, background: '#5ED0FF', boxShadow: '0 0 4px #5ED0FF' },
}
