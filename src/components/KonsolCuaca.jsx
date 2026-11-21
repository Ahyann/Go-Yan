import { useLanguage } from '../context/LanguageContext.jsx'
import { TEKS_STATUS, jenisCuaca, useStatusSiaga } from '../lib/statusSiaga'
import { IkonCuaca } from './BarisStatusSiaga.jsx'

const TEKS = {
  id: { kembali: 'KEMBALI', judul: 'CUACA 12 JAM', hujan: 'HUJAN ± ', cerah: 'TANPA HUJAN', kosong: 'NYALAKAN LOKASI UNTUK PRAKIRAAN' },
  en: { kembali: 'BACK', judul: '12H FORECAST', hujan: 'RAIN ~ ', cerah: 'NO RAIN', kosong: 'TURN ON LOCATION FOR FORECAST' },
}
const AMBANG_HUJAN = 50 // persen peluang hujan yang dianggap "akan hujan"

// Halaman prakiraan cuaca di layar konsol ojek: tombol kembali, ringkasan kapan hujan, lalu kolom per jam yang bisa digeser
// (jam, ikon, suhu, peluang hujan). Dibuka dari slot cuaca di baris status siaga.
export default function KonsolCuaca({ onKembali, lokasiAktif = false }) {
  const { lang } = useLanguage()
  const k = TEKS[lang] || TEKS.id
  const kode = (TEKS_STATUS[lang] || TEKS_STATUS.id).kode
  const { cuaca } = useStatusSiaga(lokasiAktif)
  const jam = cuaca?.jam || []
  const jamHujan = jam.find((j) => j.hujan >= AMBANG_HUJAN)

  return (
    <div className="tv-nyala">
      <div style={s.kepala}>
        <button type="button" onClick={onKembali} style={s.kembali} aria-label={k.kembali}>
          <span aria-hidden="true">◀</span> {k.kembali}
        </button>
        <span style={s.judul}>{k.judul}</span>
        <span style={{ ...s.ringkas, color: jamHujan ? '#5ED0FF' : '#4ADE80' }}>{jam.length ? (jamHujan ? `${k.hujan}${jamHujan.w}` : k.cerah) : ''}</span>
      </div>
      {jam.length === 0 ? (
        <div style={s.kosong}>{k.kosong}</div>
      ) : (
        <div style={s.gulir} role="list">
          {jam.map((j, i) => {
            const jenis = jenisCuaca(j.kode)
            const hujan = j.hujan >= AMBANG_HUJAN
            return (
              <div key={j.w + i} role="listitem" aria-label={`${j.w} ${j.suhu}° ${kode[jenis]} ${j.hujan}%`} style={{ ...s.sel, ...(hujan ? s.selHujan : null) }}>
                <span style={s.waktu}>{i === 0 ? (lang === 'en' ? 'NOW' : 'SKRG') : j.w}</span>
                <IkonCuaca jenis={jenis} />
                <span style={s.baris3}>
                  <span style={s.suhu}>{j.suhu}°</span>
                  <span style={{ ...s.persen, color: hujan ? '#5ED0FF' : undefined, opacity: hujan ? 1 : 0.55 }}>{j.hujan}%</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  kepala: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 22 },
  kembali: { background: 'rgba(4, 25, 42, 0.7)', border: '1px solid rgba(94, 208, 255, 0.5)', color: '#FFFFFF', font: 'inherit', fontSize: 8, letterSpacing: '0.1em', padding: '0 7px', height: 20, cursor: 'pointer', whiteSpace: 'nowrap' },
  judul: { fontSize: 9, letterSpacing: '0.1em', opacity: 0.75, whiteSpace: 'nowrap' },
  ringkas: { fontSize: 9, letterSpacing: '0.08em', whiteSpace: 'nowrap' },
  gulir: { display: 'flex', gap: 4, overflowX: 'auto', marginTop: 4, scrollbarWidth: 'none', touchAction: 'pan-x' },
  sel: { flex: '0 0 50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '2px 0', background: 'rgba(4, 25, 42, 0.55)', border: '1px solid rgba(94, 208, 255, 0.2)' },
  selHujan: { borderColor: 'rgba(94, 208, 255, 0.75)', background: 'rgba(30, 90, 140, 0.45)' },
  waktu: { fontSize: 7, letterSpacing: '0.08em', opacity: 0.7 },
  baris3: { display: 'flex', alignItems: 'baseline', gap: 3 },
  suhu: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#FFFFFF' },
  persen: { fontSize: 7, letterSpacing: '0.06em' },
  kosong: { fontSize: 9, letterSpacing: '0.08em', opacity: 0.7, textAlign: 'center', marginTop: 18 },
}
