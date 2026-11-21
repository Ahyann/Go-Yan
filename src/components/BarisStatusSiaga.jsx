import { useLanguage } from '../context/LanguageContext.jsx'
import { TEKS_STATUS, jenisCuaca, tingkatSinyal, useStatusSiaga } from '../lib/statusSiaga'

const svg = { shapeRendering: 'crispEdges', style: { flexShrink: 0, display: 'block' } }

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

function IkonSinyal({ tingkat }) {
  const warna = tingkat >= 3 ? '#4ADE80' : tingkat === 2 ? '#FFD84A' : '#ED1C24'
  return (
    <svg width="17" height="12" viewBox="0 0 14 10" aria-hidden="true" {...svg}>
      {[3, 5, 7, 10].map((h, i) => (
        <rect key={i} x={i * 4} y={10 - h} width="2" height={h} fill={i < tingkat ? warna : '#2B4A63'} className={i === tingkat - 1 ? 'ik-denyut' : undefined} />
      ))}
    </svg>
  )
}

// Piala emas piksel: kilap putih menyapu badan piala sesekali dan ada kilau kecil di pojok kanan atas
function IkonTrip() {
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
      <g fill="#FFD84A">{bentuk}</g>
      <rect x="3" y="2" width="1" height="2" fill="#FFF4B0" />
      <rect x="3" y="9" width="6" height="1" fill="#C99A12" />
      <g clipPath="url(#ik-piala-klip)">
        <g className="ik-kilap"><rect x="-1" y="0" width="2" height="12" fill="#FFFFFF" opacity="0.9" /><rect x="2" y="0" width="1" height="12" fill="#FFFFFF" opacity="0.5" /></g>
      </g>
      <g fill="#FFFFFF" className="ik-kilau"><rect x="12" y="0" width="1" height="3" /><rect x="11" y="1" width="3" height="1" /></g>
    </svg>
  )
}

// Baris di bawah jam konsol ojek saat siaga: cuaca, sinyal GPS, dan total trip, dengan ikon piksel.
export default function BarisStatusSiaga({ totalTrip = null, lokasiAktif = false, onBukaCuaca = null }) {
  const { lang } = useLanguage()
  const k = TEKS_STATUS[lang] || TEKS_STATUS.id
  const { akurasi, cuaca } = useStatusSiaga(lokasiAktif)
  const tingkat = tingkatSinyal(akurasi)
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
  const slotTombol = (ikon, nilai, label, aria, onKlik) => (
    <button type="button" className="slot-status" style={{ ...s.slot, ...s.tombolSlot }} onClick={onKlik} aria-label={aria}>{isiSlot(ikon, nilai, label, true)}</button>
  )

  return (
    <div role="group" aria-label={`${cuaca ? `${cuaca.suhu}°, ${k.kode[jenis]}` : k.cuaca}; ${k.gps} ${k.sinyal[tingkat]}; ${k.trip} ${totalTrip ?? '-'}`} style={s.baris}>
      {onBukaCuaca
        ? slotTombol(<IkonCuaca jenis={jenis || 'mendung'} />, cuaca ? `${cuaca.suhu}°` : '--°', jenis ? k.kode[jenis] : k.cuaca, lang === 'en' ? 'Open weather forecast' : 'Buka prakiraan cuaca', onBukaCuaca)
        : slot(<IkonCuaca jenis={jenis || 'mendung'} />, cuaca ? `${cuaca.suhu}°` : '--°', jenis ? k.kode[jenis] : k.cuaca)}
      {slot(<IkonSinyal tingkat={tingkat} />, k.sinyal[tingkat], k.gps)}
      {slot(<IkonTrip />, totalTrip ?? '--', k.trip)}
    </div>
  )
}

const s = {
  baris: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 26, borderTop: '1px solid rgba(94, 208, 255, 0.22)', paddingTop: 4 },
  slot: { display: 'inline-flex', alignItems: 'center', gap: 7 },
  tombolSlot: { background: 'none', border: 'none', padding: 0, margin: 0, color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' },
  panah: { color: '#5ED0FF' },
  teks: { display: 'flex', flexDirection: 'column', lineHeight: 1.05 },
  nilai: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.04em', color: '#FFFFFF', whiteSpace: 'nowrap' },
  label: { fontSize: 6, letterSpacing: '0.14em', opacity: 0.6, whiteSpace: 'nowrap', marginTop: 1 },
}
