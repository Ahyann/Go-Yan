import { useEffect, useRef, useState } from 'react'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import { usePesanOjek } from '../lib/usePesanOjek'
import { playGeserTik, playLunasSemua, playKonsolMati, playTombolKamera, playTombolSuara } from '../lib/sound'
import { getar } from '../lib/getar'

const KUNCI_UNDO = 'goyan:undo-lunas'
const BATAS_UNDO = 24 * 60 * 60 * 1000
const LAMA_TAHAN = 1000 // ms menahan tombol sampai bar penuh
// Tombol fungsi (belum saja, salin rekap, tagih) disembunyikan dulu: terlalu rapat dengan baris tab di bawahnya.
// Kodenya tetap ada; nyalakan lagi setelah letaknya dipilih dari mockup.
const TOMBOL_FUNGSI = false

function bacaUndo() {
  try {
    const u = JSON.parse(localStorage.getItem(KUNCI_UNDO) || 'null')
    return u && Array.isArray(u.ids) && Date.now() - u.waktu < BATAS_UNDO ? u : null
  } catch {
    return null
  }
}

function simpanUndo(u) {
  try {
    if (u) localStorage.setItem(KUNCI_UNDO, JSON.stringify(u))
    else localStorage.removeItem(KUNCI_UNDO)
  } catch {
    // penyimpanan diblokir: undo hanya berlaku selama app terbuka
  }
}

const TEKS = {
  id: {
    belum: 'BELUM LUNAS', trip: 'TRIP', tahan: 'TAHAN UNTUK LUNASKAN SEMUA', tanya: 'LUNASKAN', bisaUndo: 'BISA DI-UNDO 24 JAM',
    batal: 'BATAL', ya: 'YA, LUNAS', ditandai: 'TRIP DITANDAI LUNAS', sisa: 'UNDO TERSEDIA · SISA', undo: 'UNDO',
    filter: 'BELUM', semua: 'SEMUA', rekap: 'REKAP', tersalin: 'TERSALIN', tagih: 'TAGIH', terkirim: 'TERKIRIM',
    semuaLunas: 'SEMUA SUDAH LUNAS', rekapJudul: 'Rekap Go-Yan belum lunas', tagihPesan: 'Halo Fajri, ada {n} trip yang belum ditransfer, totalnya {total}.',
  },
  en: {
    belum: 'UNPAID', trip: 'TRIPS', tahan: 'HOLD TO MARK ALL PAID', tanya: 'MARK PAID', bisaUndo: 'UNDO AVAILABLE FOR 24H',
    batal: 'CANCEL', ya: 'YES, PAID', ditandai: 'TRIPS MARKED PAID', sisa: 'UNDO AVAILABLE · LEFT', undo: 'UNDO',
    filter: 'UNPAID', semua: 'ALL', rekap: 'RECAP', tersalin: 'COPIED', tagih: 'REMIND', terkirim: 'SENT',
    semuaLunas: 'ALL PAID', rekapJudul: 'Go-Yan unpaid recap', tagihPesan: 'Hi Fajri, {n} trips are not transferred yet, total {total}.',
  },
}

const ikon = {
  cek: <path d="M4 12l5 5L20 6" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  salin: <><rect x="8" y="8" width="12" height="12" /><path d="M4 16V4h12" /></>,
  kirim: <path d="M3 11l18-8-8 18-2-8z" />,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-3" /></>,
}

function Ikon({ nama }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square" aria-hidden="true">
      {ikon[nama]}
    </svg>
  )
}

// Konsol bawah saat tab History terbuka: tahan bar untuk melunaskan semua trip yang belum dibayar, lalu konfirmasi,
// lalu bisa di-undo selama 24 jam. Di bawahnya tombol fungsi: tampilkan yang belum saja, salin rekap, tagih Fajri.
export default function KonsolRiwayat({ riwayat, onEditRiwayat, hanyaBelum, onHanyaBelum }) {
  const { lang } = useLanguage()
  const x = TEKS[lang] || TEKS.id
  const { kirimPesan } = usePesanOjek()
  const [fase, setFase] = useState('awal') // awal | konfirmasi
  const [undo, setUndo] = useState(bacaUndo)
  const [tahan, setTahan] = useState(0)
  const [kilat, setKilat] = useState(null) // 'rekap' | 'tagih' sebentar setelah ditekan
  const [sekarang, setSekarang] = useState(() => Date.now())
  const tahanRef = useRef(null)

  const belum = riwayat.filter((r) => r.statusBayar === STATUS_BAYAR.BELUM)
  const total = belum.reduce((n, r) => n + r.tarif, 0)

  useEffect(() => {
    if (!undo) return undefined
    const id = setInterval(() => {
      setSekarang(Date.now())
      if (Date.now() - undo.waktu >= BATAS_UNDO) {
        simpanUndo(null)
        setUndo(null)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [undo])

  useEffect(() => () => cancelAnimationFrame(tahanRef.current?.raf), [])

  function mulaiTahan() {
    if (belum.length === 0) return
    const mulai = performance.now()
    let langkah = 0
    const jalan = () => {
      const p = Math.min(1, (performance.now() - mulai) / LAMA_TAHAN)
      setTahan(p)
      const l = Math.floor(p * 10)
      if (l > langkah) { langkah = l; playGeserTik(l) }
      if (p >= 1) {
        tahanRef.current = null
        setTahan(0)
        getar(20)
        konfirmasi()
        return
      }
      tahanRef.current = { raf: requestAnimationFrame(jalan) }
    }
    tahanRef.current = { raf: requestAnimationFrame(jalan) }
  }

  function lepasTahan() {
    if (!tahanRef.current) return
    cancelAnimationFrame(tahanRef.current.raf)
    tahanRef.current = null
    setTahan(0)
  }

  function konfirmasi() {
    const ids = belum.map((r) => r.id)
    ids.forEach((id) => Promise.resolve(onEditRiwayat(id, { statusBayar: STATUS_BAYAR.LUNAS })).catch((e) => console.error(e)))
    const u = { ids, waktu: Date.now(), total }
    simpanUndo(u)
    setUndo(u)
    setFase('sukses')
    playLunasSemua()
    getar(25)
  }

  // Animasi ceklis berjalan sebentar, lalu konsol menampilkan hitung mundur undo
  useEffect(() => {
    if (fase !== 'sukses') return undefined
    const id = setTimeout(() => setFase('awal'), 1900)
    return () => clearTimeout(id)
  }, [fase])

  function batalkanLunas() {
    undo.ids.forEach((id) => Promise.resolve(onEditRiwayat(id, { statusBayar: STATUS_BAYAR.BELUM })).catch((e) => console.error(e)))
    simpanUndo(null)
    setUndo(null)
    playKonsolMati()
  }

  function teksRekap() {
    const baris = belum.map((r) => `- ${r.tanggal} ${r.jam || ''} ${r.aksi || ''} ${formatRupiah(r.tarif)}`.replace(/\s+/g, ' '))
    return `${x.rekapJudul}: ${belum.length} trip, ${formatRupiah(total)}\n${baris.join('\n')}`
  }

  function salinRekap() {
    playTombolKamera()
    Promise.resolve(navigator.clipboard?.writeText(teksRekap())).catch(() => {})
    tandaiKilat('rekap')
  }

  function tagih() {
    if (belum.length === 0) return
    playTombolSuara()
    Promise.resolve(kirimPesan(x.tagihPesan.replace('{n}', belum.length).replace('{total}', formatRupiah(total)))).catch((e) => console.error(e))
    tandaiKilat('tagih')
  }

  function tandaiKilat(k) {
    setKilat(k)
    setTimeout(() => setKilat(null), 1400)
  }

  // Sesudah bar penuh: tanpa konfirmasi, langsung lunas dengan animasi ceklis (kotak hijau membal, ceklis tergambar, percikan piksel)
  if (fase === 'sukses' && undo) {
    return (
      <div style={{ ...s.baris, gap: 12, height: 66, marginTop: -2 }}>
        <div key={undo.waktu} className="cek-kotak" style={s.kotakCek}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#04192A" strokeWidth="3.4" strokeLinecap="square" aria-hidden="true">
            <path className="cek-gambar" pathLength="1" d="M5 12.5l4.5 4.5L19 7" />
          </svg>
          {PERCIK.map(([dx, dy, d], i) => (
            <span key={i} className="cek-percik" style={{ ...s.percik, '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${0.18 + d}s`, background: i % 2 ? '#FFFFFF' : '#5ED0FF' }} />
          ))}
        </div>
        <div className="cek-teks" style={{ minWidth: 0 }}>
          <div style={{ ...s.judul, color: '#4ADE80', fontSize: 12 }}>{undo.ids.length} {x.ditandai}</div>
          <div style={{ ...s.redup, marginTop: 4 }}>{formatRupiah(undo.total).toUpperCase()}</div>
        </div>
      </div>
    )
  }

  if (undo) {
    const sisa = Math.max(0, BATAS_UNDO - (sekarang - undo.waktu))
    const j = String(Math.floor(sisa / 3600000)).padStart(2, '0')
    const m = String(Math.floor((sisa % 3600000) / 60000)).padStart(2, '0')
    const d = String(Math.floor((sisa % 60000) / 1000)).padStart(2, '0')
    return (
      <div style={s.kolom}>
        <div style={{ ...s.judul, color: '#4ADE80' }}>✓ {undo.ids.length} {x.ditandai}</div>
        <div style={s.redup}>{x.sisa} {j}:{m}:{d}</div>
        <div style={s.baris}>
          <button type="button" data-tanpa-suara className="tekan" style={{ ...s.tombol, ...s.lebar, color: '#FFD23F', borderColor: '#FFD23F' }} onClick={batalkanLunas}><Ikon nama="undo" />{x.undo}</button>
          {TOMBOL_FUNGSI && <TombolFilter hanyaBelum={hanyaBelum} onHanyaBelum={onHanyaBelum} x={x} />}
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...s.kolom, marginTop: 5 }}>
      <div style={{ ...s.baris, justifyContent: 'space-between', fontSize: 10 }}>
        <span style={{ opacity: 0.7 }}>{belum.length ? `${x.belum} · ${belum.length} ${x.trip}` : x.semuaLunas}</span>
        {belum.length > 0 && <span style={{ color: '#FF6B78' }}>{formatRupiah(total).toUpperCase()}</span>}
      </div>
      <button
        type="button"
        data-tanpa-suara
        className="tanpa-pilih"
        disabled={belum.length === 0}
        style={{ ...s.bar, opacity: belum.length ? 1 : 0.4 }}
        onPointerDown={mulaiTahan}
        onPointerUp={lepasTahan}
        onPointerLeave={lepasTahan}
        onPointerCancel={lepasTahan}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span style={{ ...s.isiBar, width: `${tahan * 100}%` }} />
        <span style={{ position: 'relative' }}>{x.tahan} <span className="panah-kedip">▮▮▮</span></span>
      </button>
      {TOMBOL_FUNGSI && (
        <div style={s.baris}>
          <TombolFilter hanyaBelum={hanyaBelum} onHanyaBelum={onHanyaBelum} x={x} />
          <button type="button" data-tanpa-suara className="tekan" style={{ ...s.tombol, ...s.lebar }} onClick={salinRekap}><Ikon nama="salin" />{kilat === 'rekap' ? x.tersalin : x.rekap}</button>
          <button type="button" data-tanpa-suara className="tekan" style={{ ...s.tombol, ...s.lebar, opacity: belum.length ? 1 : 0.4 }} onClick={tagih}><Ikon nama="kirim" />{kilat === 'tagih' ? x.terkirim : x.tagih}</button>
        </div>
      )}
    </div>
  )
}

function TombolFilter({ hanyaBelum, onHanyaBelum, x }) {
  return (
    <button
      type="button"
      data-tanpa-suara
      className="tekan"
      style={{ ...s.tombol, ...s.lebar, ...(hanyaBelum ? s.cyanIsi : null) }}
      onClick={() => { playTombolKamera(); onHanyaBelum(!hanyaBelum) }}
    >
      <Ikon nama="filter" />{hanyaBelum ? x.semua : x.filter}
    </button>
  )
}

// Arah percikan di sekitar kotak ceklis: [geser x, geser y, jeda]
const PERCIK = [[-26, -22, 0], [0, -30, 0.03], [26, -22, 0.06], [32, 2, 0.02], [24, 26, 0.05], [-2, 32, 0.01], [-28, 24, 0.04], [-34, 0, 0.07]]

const s = {
  kotakCek: { position: 'relative', width: 44, height: 44, flexShrink: 0, background: '#4ADE80', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(74,222,128,0.6)' },
  percik: { position: 'absolute', left: 19, top: 19, width: 6, height: 6, opacity: 0, pointerEvents: 'none' },
  kolom: { display: 'flex', flexDirection: 'column', gap: 7, marginTop: -2 },
  judul: { fontSize: 11, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  redup: { fontSize: 10, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  baris: { display: 'flex', gap: 6, alignItems: 'center' },
  tombol: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 26, padding: '0 8px',
    fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.06em', color: '#5ED0FF', background: 'transparent',
    border: '1px solid #5ED0FF', borderRadius: 0, whiteSpace: 'nowrap',
  },
  lebar: { flex: 1, minWidth: 0 },
  hijauIsi: { background: '#4ADE80', borderColor: '#4ADE80', color: '#04192A' },
  cyanIsi: { background: '#5ED0FF', color: '#04192A' },
  bar: {
    position: 'relative', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.08em', color: '#4ADE80', background: 'transparent',
    border: '1px solid #4ADE80', borderRadius: 0, touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none',
  },
  isiBar: { position: 'absolute', left: 0, top: 0, bottom: 0, background: 'rgba(74,222,128,0.3)' },
}
