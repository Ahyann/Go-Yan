import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { HARI_KERJA_KEYS } from '../lib/constants'
import { playGeserTik, playLunasSemua, playKonsolMati } from '../lib/sound'
import { getar } from '../lib/getar'
import SwipeToFinish from './SwipeToFinish.jsx'

// Jadwal biasa Ahyan: Senin, Selasa, Kamis jemput 15:00; Rabu antar (tanpa jam) dan jemput 16:00; Jumat kosong.
const KOSONG = { aktif: false, jam: '' }
const PRESET = {
  senin: { antar: KOSONG, jemput: { aktif: true, jam: '15:00' } },
  selasa: { antar: KOSONG, jemput: { aktif: true, jam: '15:00' } },
  rabu: { antar: { aktif: true, jam: '' }, jemput: { aktif: true, jam: '16:00' } },
  kamis: { antar: KOSONG, jemput: { aktif: true, jam: '15:00' } },
  jumat: { antar: KOSONG, jemput: KOSONG },
}
const MULAI_ISI = 450 // ms menunggu baris hari tampil setelah mode atur menyala
const JEDA_HARI = 260 // ms antar hari saat terisi berurutan
const PERCIK = [[-26, -22, 0], [0, -30, 0.03], [26, -22, 0.06], [32, 2, 0.02], [24, 26, 0.05], [-2, 32, 0.01], [-28, 24, 0.04], [-34, 0, 0.07]]

// Ingatan selama app terbuka: pindah tab lalu kembali ke Schedule, jadwal yang sudah terisi (belum disimpan) tetap terisi
// dan konsol langsung menampilkan hasilnya, tanpa harus menggeser lagi. Dihapus saat jadwal disimpan.
const memori = { fase: 'awal', draft: null, salinan: null }
export const jadwalSudahTerisi = () => memori.fase === 'selesai'
export function lupakanIsiJadwal() {
  memori.fase = 'awal'
  memori.draft = null
  memori.salinan = null
}

const TEKS = {
  id: {
    judulJadwal: 'JADWAL MINGGUAN', belumDiisi: 'BELUM DIISI', geser: 'GESER UNTUK ISI JADWAL', mengisi: 'MENGISI JADWAL…',
    terisi: 'JADWAL TERISI', ingatSave: 'JANGAN LUPA TEKAN SAVE', undo: 'UNDO', hari: ['SEN', 'SEL', 'RAB', 'KAM', 'JUM'],
  },
  en: {
    judulJadwal: 'WEEKLY SCHEDULE', belumDiisi: 'NOT SET', geser: 'SWIPE TO FILL SCHEDULE', mengisi: 'FILLING SCHEDULE…',
    terisi: 'SCHEDULE FILLED', ingatSave: "DON'T FORGET TO SAVE", undo: 'UNDO', hari: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  },
}

// Isi konsol bawah saat tab Schedule ojek dalam mode edit: geser untuk mengisi jadwal biasa. Hari terisi berurutan
// (baris menyala, tik naik nada), lalu ceklis dan nada selesai. Isinya baru tersimpan setelah Save schedule ditekan.
export default function KonsolJadwal({ jadwalRef, onHariBaru, onMasukAtur }) {
  const { lang } = useLanguage()
  const x = TEKS[lang] || TEKS.id
  const [fase, setFase] = useState(memori.fase) // awal | isi | selesai
  const [langkah, setLangkah] = useState(0)
  const [putaran, setPutaran] = useState(0)
  const timerRef = useRef([])
  const salinanRef = useRef(null)

  useEffect(() => () => timerRef.current.forEach(clearTimeout), [])

  // Kembali ke tab ini sesudah pernah terisi: pasang lagi isi jadwal yang tadi
  useEffect(() => {
    if (memori.fase === 'selesai' && memori.draft) {
      jadwalRef.current?.pasangDraft(memori.draft)
      salinanRef.current = memori.salinan
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function isiJadwal() {
    salinanRef.current = jadwalRef.current?.ambilDraft() ?? null
    memori.salinan = salinanRef.current
    // Hasil akhirnya langsung dicatat: kalau pindah tab di tengah animasi, saat kembali jadwalnya sudah terisi semua
    const basis = salinanRef.current || {}
    const akhir = { ...basis }
    HARI_KERJA_KEYS.forEach((h) => { akhir[h] = { ...(basis[h] || {}), ...PRESET[h] } })
    memori.fase = 'selesai'
    memori.draft = akhir
    onMasukAtur?.() // masuk mode atur otomatis supaya semua baris hari tampil
    setFase('isi')
    setLangkah(0)
    HARI_KERJA_KEYS.forEach((hari, i) => {
      timerRef.current.push(setTimeout(() => {
        jadwalRef.current?.isiHari(hari, PRESET[hari])
        onHariBaru(hari)
        setLangkah(i + 1)
        playGeserTik(2 + i * 2)
        getar(8)
      }, MULAI_ISI + i * JEDA_HARI))
    })
    timerRef.current.push(setTimeout(() => {
      memori.fase = 'selesai'
      memori.draft = jadwalRef.current?.ambilDraft() ?? null
      setFase('selesai')
      onHariBaru(null)
      playLunasSemua()
      getar(25)
    }, MULAI_ISI + HARI_KERJA_KEYS.length * JEDA_HARI + 120))
  }

  function batalkan() {
    if (salinanRef.current) jadwalRef.current?.pasangDraft(salinanRef.current)
    memori.fase = 'awal'
    memori.draft = null
    setFase('awal')
    setPutaran((n) => n + 1) // tombol geser dipasang ulang dari awal
    playKonsolMati()
  }

  if (fase === 'isi') {
    return (
      <div style={s.kolom}>
        <div style={s.judul}>{x.mengisi}</div>
        <div style={s.seg}>
          {HARI_KERJA_KEYS.map((h, i) => <span key={h} style={{ ...s.petak, background: i < langkah ? '#4ADE80' : '#1E3A52' }} />)}
        </div>
      </div>
    )
  }

  if (fase === 'selesai') {
    return (
      <div style={{ ...s.baris, gap: 12, height: 60 }}>
        <div className="cek-kotak" style={s.kotakCek}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#04192A" strokeWidth="3.4" strokeLinecap="square" aria-hidden="true">
            <path className="cek-gambar" pathLength="1" d="M5 12.5l4.5 4.5L19 7" />
          </svg>
          {PERCIK.map(([dx, dy, d], i) => (
            <span key={i} className="cek-percik" style={{ ...s.percik, '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${0.18 + d}s`, background: i % 2 ? '#FFFFFF' : '#5ED0FF' }} />
          ))}
        </div>
        <div className="cek-teks" style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...s.judul, color: '#4ADE80', fontSize: 12 }}>{x.terisi}</div>
          <div style={{ ...s.redup, marginTop: 4 }}>{x.ingatSave}</div>
        </div>
        <button type="button" data-tanpa-suara className="tekan" style={s.undo} onClick={batalkan}>{x.undo}</button>
      </div>
    )
  }

  return (
    <div style={s.kolom}>
      <div style={{ ...s.baris, justifyContent: 'space-between', fontSize: 9, letterSpacing: '0.06em', height: 20 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#FFFFFF', fontSize: 10 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4M8 15l3 3 5-6" />
          </svg>
          {x.judulJadwal}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#FF6B78' }}>
          <i className="titik-merah" style={{ width: 6, height: 6, background: '#FF4C4C', display: 'block' }} />
          {x.belumDiisi}
        </span>
      </div>
      <SwipeToFinish key={putaran} label={x.geser} tinggi={34} konsol cyan onConfirm={isiJadwal} />
    </div>
  )
}

const s = {
  kolom: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: -2 },
  baris: { display: 'flex', alignItems: 'center' },
  judul: { fontSize: 11, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  redup: { fontSize: 9, opacity: 0.75, lineHeight: 1.55, letterSpacing: '0.04em' },
  seg: { display: 'flex', gap: 4 },
  petak: { flex: 1, height: 9, transition: 'background 0.12s' },
  hari: { display: 'flex', justifyContent: 'space-between', fontSize: 8, opacity: 0.65 },
  kotakCek: { position: 'relative', width: 40, height: 40, flexShrink: 0, background: '#4ADE80', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(74,222,128,0.6)' },
  percik: { position: 'absolute', left: 17, top: 17, width: 6, height: 6, opacity: 0, pointerEvents: 'none' },
  undo: { flexShrink: 0, padding: '6px 8px', fontFamily: 'inherit', fontSize: 9, color: '#FFD23F', background: 'transparent', border: '1px solid #FFD23F', borderRadius: 0 },
}
