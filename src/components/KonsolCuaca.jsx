import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { TEKS_STATUS, jenisCuaca, useStatusSiaga } from '../lib/statusSiaga'
import { playGeserHalus, playGeserTik } from '../lib/sound'
import { TITIK, titikDekat, useCuacaTitik } from '../lib/cuacaTitik'
import { acaraJam, cuacaPadaJadwal, jadwalTerdekat } from '../lib/jadwalTerdekat'
import { IkonCuaca } from './BarisStatusSiaga.jsx'

const TEKS = {
  id: { stJas: 'BAWA JAS HUJAN', jamS: 'J', menitS: 'M', kini: 'SEKARANG', label: 'STATUS:', tanpaJemput: 'BELUM ADA JEMPUT', stPanas: 'PANAS, MINUM!', stAman: 'AMAN', kembali: 'KEMBALI', kosong: 'NYALAKAN LOKASI UNTUK PRAKIRAAN', memuat: 'MEMUAT PRAKIRAAN...', lokasi: 'KAMU', jemput: 'JEMPUT', antar: 'ANTAR', ganti: 'Ganti titik cuaca' },
  en: { stJas: 'WEAR RAINCOAT', jamS: 'H', menitS: 'M', kini: 'NOW', label: 'STATUS:', tanpaJemput: 'NO PICKUP 24H', stPanas: 'HOT, DRINK UP', stAman: 'ALL CLEAR', kembali: 'BACK', kosong: 'TURN ON LOCATION FOR FORECAST', memuat: 'LOADING FORECAST...', lokasi: 'YOU', jemput: 'PICKUP', antar: 'DROP-OFF', ganti: 'Switch weather location' },
}
const AMBANG_HUJAN = 50 // persen peluang hujan yang dianggap "akan hujan"
const MERAH = '#ED1C24'
const BATAS_PANAS = 32 // derajat Celsius yang dianggap panas sekali

// Emote piksel untuk status di tengah kepala halaman
function EmoteStatus({ jenis }) {
  const p = { width: 13, height: 13, viewBox: '0 0 12 12', shapeRendering: 'crispEdges', 'aria-hidden': true, style: { flexShrink: 0, display: 'block' } }
  if (jenis === 'jas') {
    return (
      <svg {...p} className="ik-denyut">
        <g fill="#FFD84A"><rect x="4" y="0" width="4" height="1" /><rect x="3" y="1" width="6" height="2" /><rect x="2" y="3" width="8" height="8" /><rect x="1" y="4" width="1" height="5" /><rect x="10" y="4" width="1" height="5" /></g>
        <g fill="#04192A"><rect x="5" y="2" width="2" height="1" /><rect x="6" y="5" width="1" height="1" /><rect x="6" y="8" width="1" height="1" /></g>
        <g fill="#5ED0FF"><rect className="ik-tetes" x="0" y="0" width="1" height="2" /><rect className="ik-tetes" style={{ animationDelay: '0.4s' }} x="11" y="1" width="1" height="2" /></g>
      </svg>
    )
  }
  if (jenis === 'panas') {
    return (
      <svg {...p}>
        <rect x="5" y="0" width="2" height="1" fill="#FFFFFF" />
        <rect x="5" y="1" width="2" height="2" fill="#9FD9F5" />
        <rect x="3" y="3" width="6" height="9" fill="#9FD9F5" />
        <rect x="4" y="6" width="4" height="5" fill="#5ED0FF" className="ik-denyut" />
      </svg>
    )
  }
  return (
    <svg {...p}>
      <g fill="#4ADE80"><rect x="1" y="6" width="2" height="2" /><rect x="3" y="8" width="2" height="2" /><rect x="5" y="6" width="2" height="2" /><rect x="7" y="4" width="2" height="2" /><rect x="9" y="2" width="2" height="2" /></g>
    </svg>
  )
}

// Halaman prakiraan cuaca di layar konsol ojek: cuaca sekarang besar di kiri beserta nama tempat, jam-jam berikutnya di kanan
// (bisa digeser). Ketuk nama titik untuk berpindah antara posisimu dan Kantor (kalau kamu sedang di Kantor, hanya satu titik). Jam yang cocok dengan jadwal jemput/antar ditandai merah, dan status jas hujan
// memakai cuaca di Kantor (tempat jemput bawaan) pada jam jadwal terdekat.
export default function KonsolCuaca({ onKembali, lokasiAktif = false, jadwal = null }) {
  const { lang } = useLanguage()
  const k = TEKS[lang] || TEKS.id
  const kode = (TEKS_STATUS[lang] || TEKS_STATUS.id).kode
  const { cuaca: cuacaKamu, posisi } = useStatusSiaga(lokasiAktif)
  const dataTitik = useCuacaTitik()
  const [idxTitik, setIdxTitik] = useState(0)

  // Titik pertama = posisimu. Kalau kamu sedang di Kantor, titik itu memakai nama KANTOR dan tidak diulang lagi.
  const dekat = titikDekat(posisi)
  const daftarTitik = [
    { id: 'kamu', nama: dekat ? dekat.nama : k.lokasi, data: cuacaKamu, pusatNama: cuacaKamu?.nama },
    ...TITIK.filter((t) => !dekat || t.id !== dekat.id).map((t) => ({ id: t.id, nama: t.nama, data: dataTitik[t.id] || null })),
  ]
  const titikAktif = daftarTitik[idxTitik % daftarTitik.length]
  const cuaca = titikAktif.data
  const jam = cuaca?.jam || []
  const berikut = jam.slice(1)
  const tanda = berikut.map((j) => acaraJam(jadwal, j))
  const idxJadwal = tanda.findIndex((t) => t.length > 0)
  const jenisSkrg = cuaca ? jenisCuaca(cuaca.kode) : 'mendung'

  function gantiTitik() {
    setIdxTitik((i) => (i + 1) % daftarTitik.length)
    playGeserTik(2)
  }
  const [sekarang, setSekarang] = useState(() => Date.now())
  const gulirRef = useRef(null)
  const kolomTerakhir = useRef(0)

  // Bunyi tik halus setiap deretan jam bergeser satu kolom (44px)
  function saatGulir(e) {
    const k = Math.round(e.currentTarget.scrollLeft / 44)
    if (k !== kolomTerakhir.current) {
      kolomTerakhir.current = k
      playGeserHalus()
    }
  }

  // Hitung mundur ke jadwal diperbarui tiap 30 detik
  useEffect(() => {
    const id = setInterval(() => setSekarang(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  // Deretan jam otomatis digeser supaya kolom jadwal terdekat langsung kelihatan
  useEffect(() => {
    const g = gulirRef.current
    if (!g || idxJadwal < 0) return
    const sel = g.children[idxJadwal]
    if (sel) {
      g.scrollLeft = Math.max(0, sel.offsetLeft - g.offsetLeft - 44)
      kolomTerakhir.current = Math.round(g.scrollLeft / 44) // geser otomatis tidak berbunyi
    }
  }, [idxJadwal, jam.length, idxTitik])

  // Pojok kanan: hitung mundur ke jadwal terdekat dalam 24 jam, atau keterangan belum ada jemputan
  const terdekat = jadwalTerdekat(jadwal, sekarang)

  // Status jas hujan / panas / aman memakai cuaca di tempat jemput (Kantor) pada jam jadwal terdekat, bukan posisimu
  const jamTempatJemput = (dekat && dekat.id === 'kantor' ? cuacaKamu?.jam : dataTitik.kantor?.jam) || []
  const sasaran = cuacaPadaJadwal(jamTempatJemput, terdekat)
  let status = null
  if (sasaran) {
    const jn = jenisCuaca(sasaran.kode)
    if (jn === 'gerimis' || jn === 'hujan' || jn === 'petir' || sasaran.hujan >= AMBANG_HUJAN) status = { jenis: 'jas', teks: k.stJas, warna: '#5ED0FF' }
    else if (sasaran.suhu >= BATAS_PANAS) status = { jenis: 'panas', teks: k.stPanas, warna: '#FFD84A' }
    else status = { jenis: 'aman', teks: k.stAman, warna: '#4ADE80' }
  }

  let ringkas = k.tanpaJemput
  let warnaRingkas = 'rgba(232, 237, 249, 0.55)'
  if (terdekat) {
    const jm = Math.floor(terdekat.sisa / 3600000)
    const mn = Math.max(0, Math.floor((terdekat.sisa % 3600000) / 60000))
    ringkas = `${k[terdekat.jenis]} ${terdekat.sisa <= 0 ? k.kini : jm > 0 ? `${jm}${k.jamS} ${mn}${k.menitS}` : `${mn}${k.menitS}`}`
    warnaRingkas = '#FF7A85'
  }

  return (
    <div className="tv-nyala">
      <div style={s.kepala}>
        <button type="button" onClick={onKembali} style={s.kembali} aria-label={k.kembali}>
          <span aria-hidden="true" style={{ color: '#5ED0FF' }}>◀</span> {k.kembali}
        </button>
        <span style={s.status} aria-label={`${k.label} ${ringkas}${status && terdekat ? `, ${status.teks}` : ''}`}>
          <span style={s.statusLabel}>{k.label}</span>
          {status && terdekat && <EmoteStatus jenis={status.jenis} />}
          <span style={{ ...s.ringkas, color: warnaRingkas }}>{ringkas}</span>
        </span>
      </div>
      {jam.length === 0 || !cuaca ? (
        <div style={s.kosong}>
          {idxTitik % daftarTitik.length === 0 ? k.kosong : k.memuat}
          {daftarTitik.length > 1 && <button type="button" className="slot-status" onClick={gantiTitik} style={{ ...s.tempatTombol, display: 'block', margin: '6px auto 0' }}><span style={s.tempat}>{titikAktif.nama} ↻</span></button>}
        </div>
      ) : (
        <div style={s.badan}>
          <div style={s.kiri}>
            <IkonCuaca jenis={jenisSkrg} />
            <span style={s.kiriTeks}>
              <span style={s.suhuBesar}>{cuaca.suhu}°</span>
              <span style={s.kondisi}>{kode[jenisSkrg]}</span>
              {daftarTitik.length > 1 ? (
                <>
                  <button type="button" className="slot-status" onClick={gantiTitik} style={s.tempatTombol} aria-label={`${k.ganti}: ${titikAktif.nama}`}>
                    <span style={s.tempat}>{titikAktif.nama} ↻</span>
                  </button>
                  <span style={s.titikRow} aria-hidden="true">
                    {daftarTitik.map((t, i) => <i key={t.id} style={{ ...s.titikKecil, width: i === idxTitik % daftarTitik.length ? 9 : 4, background: i === idxTitik % daftarTitik.length ? '#5ED0FF' : '#3F566E' }} />)}
                  </span>
                </>
              ) : (
                <span style={s.tempat}>{titikAktif.nama}</span>
              )}
            </span>
          </div>
          <div ref={gulirRef} onScroll={saatGulir} className="gulir-sembunyi" style={s.gulir} role="list" aria-label={lang === 'en' ? 'Next hours, swipe sideways' : 'Jam berikutnya, geser ke samping'}>
            {berikut.map((j, i) => {
              const jenis = jenisCuaca(j.kode)
              const hujan = j.hujan >= AMBANG_HUJAN
              const acara = tanda[i][0]
              return (
                <div
                  key={j.tgl + j.w}
                  role="listitem"
                  aria-label={`${j.w} ${j.suhu}° ${kode[jenis]} ${j.hujan}%${acara ? ` ${k[acara.jenis]} ${acara.jam}` : ''}`}
                  className={acara ? 'bingkai-jemput' : undefined}
                  style={{ ...s.sel, ...(acara ? s.selJemput : null), borderBottomColor: hujan ? '#5ED0FF' : acara ? MERAH : 'transparent' }}
                >
                  <span style={s.penanda}>{acara ? k[acara.jenis] : ' '}</span>
                  <span style={{ ...s.waktu, color: acara ? '#FF7A85' : undefined }}>{j.w}</span>
                  <IkonCuaca jenis={jenis} />
                  <span style={s.baris3}>
                    <span style={s.suhu}>{j.suhu}°</span>
                    <span style={{ ...s.persen, color: hujan ? '#5ED0FF' : undefined, opacity: hujan ? 1 : 0.5 }}>{j.hujan}%</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  kepala: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 18 },
  status: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 8, letterSpacing: '0.08em', minWidth: 0, flex: '0 1 auto' },
  statusLabel: { color: '#E8EDF9', opacity: 0.6, whiteSpace: 'nowrap' },
  kembali: { background: 'none', border: 'none', color: '#FFFFFF', font: 'inherit', fontSize: 8, letterSpacing: '0.1em', padding: '2px 6px 2px 0', cursor: 'pointer', whiteSpace: 'nowrap' },
  ringkas: { fontSize: 8, letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 },
  badan: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, height: 46 },
  kiri: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingRight: 8, borderRight: '1px solid rgba(94, 208, 255, 0.2)', maxWidth: 128 },
  kiriTeks: { display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 },
  suhuBesar: { fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: '#FFFFFF' },
  kondisi: { fontSize: 7, letterSpacing: '0.14em', opacity: 0.65, whiteSpace: 'nowrap' },
  tempatTombol: { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer', color: 'inherit' },
  titikRow: { display: 'flex', gap: 3, marginTop: 3 },
  titikKecil: { height: 3, display: 'block' },
  tempat: { fontSize: 7, letterSpacing: '0.1em', color: '#5ED0FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 94 },
  gulir: { flex: 1, minWidth: 0, display: 'flex', gap: 2, overflowX: 'auto', touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', WebkitMaskImage: 'linear-gradient(90deg, #000 82%, transparent)', maskImage: 'linear-gradient(90deg, #000 82%, transparent)' },
  sel: { flex: '0 0 42px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '1px 0', borderTop: '2px solid transparent', borderBottom: '2px solid transparent' },
  // Kolom jam jemput/antar: bingkai merah tipis di keempat sisi (berkedip lewat kelas bingkai-jemput)
  selJemput: { borderTop: `1px solid ${MERAH}`, borderLeft: `1px solid ${MERAH}`, borderRight: `1px solid ${MERAH}`, paddingTop: 2 },
  penanda: { fontSize: 6, letterSpacing: '0.1em', color: '#FF7A85', whiteSpace: 'nowrap', lineHeight: 1 },
  waktu: { fontSize: 7, letterSpacing: '0.06em', opacity: 0.8 },
  baris3: { display: 'flex', alignItems: 'baseline', gap: 2 },
  suhu: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#FFFFFF' },
  persen: { fontSize: 6, letterSpacing: '0.04em' },
  kosong: { fontSize: 9, letterSpacing: '0.08em', opacity: 0.7, textAlign: 'center', marginTop: 18 },
}
