import { createPortal } from 'react-dom'

export const R_DALAM = 24
export const R_LUAR = 120
export const JARAK_LEBIH_RODA = 60
const R_LABEL = 80
const LEBAR_LABEL = 64
const TINGGI_LABEL = 36

// Sektor pertama berpusat lurus ke atas (bukan mulai dari atas), jadi pesan
// pertama ada di atas, dan kalau jumlahnya genap, pesan di tengah daftar
// (indeks jumlah/2) ada tepat di bawah.
// Titik di roda: sudut 0 = lurus ke atas, PI/2 = lurus ke kiri, PI = lurus ke bawah,
// 3PI/2 = lurus ke kanan. Sektor disusun berlawanan arah jarum jam.
function titikRoda(pusat, radius, sudut) {
  return { x: pusat.x - radius * Math.sin(sudut), y: pusat.y - radius * Math.cos(sudut) }
}

function jalurSektor(pusat, i, jumlah) {
  const a0 = (2 * Math.PI * (i - 0.5)) / jumlah
  const a1 = (2 * Math.PI * (i + 0.5)) / jumlah
  const luar0 = titikRoda(pusat, R_LUAR, a0)
  const luar1 = titikRoda(pusat, R_LUAR, a1)
  const dalam0 = titikRoda(pusat, R_DALAM, a0)
  const dalam1 = titikRoda(pusat, R_DALAM, a1)
  return (
    `M ${luar0.x} ${luar0.y} A ${R_LUAR} ${R_LUAR} 0 0 0 ${luar1.x} ${luar1.y} ` +
    `L ${dalam1.x} ${dalam1.y} A ${R_DALAM} ${R_DALAM} 0 0 1 ${dalam0.x} ${dalam0.y} Z`
  )
}

// Sektor ditentuin dari ARAH jari terhadap pusat roda, bukan dari seberapa
// pas jari nimpa tulisannya, jadi enak dipake sambil geser cepat.
export function indeksDariArah(pusat, x, y, jumlah) {
  const vx = x - pusat.x
  const vy = y - pusat.y
  const jarak = Math.hypot(vx, vy)
  if (jarak < R_DALAM || jarak > R_LUAR + JARAK_LEBIH_RODA) return null
  const lebar = (2 * Math.PI) / jumlah
  let sudut = Math.atan2(0 - vx, -vy) + lebar / 2
  if (sudut < 0) sudut += 2 * Math.PI
  if (sudut >= 2 * Math.PI) sudut -= 2 * Math.PI
  return Math.min(jumlah - 1, Math.floor(sudut / lebar))
}

// Roda penuh di sekeliling `pusat`, dibagi sektor sebanyak `pesanCepat`.
export default function RodaPesan({ pusat, terpilih, pesanCepat }) {
  // Sektor yang lagi dipilih digambar paling akhir biar garis tepinya
  // gak ketimpa sektor tetangga.
  const urutanSektor = pesanCepat
    .map((_, i) => i)
    .sort((a, b) => (a === terpilih ? 1 : b === terpilih ? -1 : 0))

  return createPortal(
    <div role="menu" style={s.lapis}>
      <div className="quick-chat-roda" style={{ ...s.isi, transformOrigin: `${pusat.x}px ${pusat.y}px` }}>
        <svg aria-hidden="true" style={s.svg}>
          <defs>
            {/* Warna memudar makin jauh dari pusat, sampai hilang di tepi roda. */}
            {[
              ['rodaIsi', '11,14,26', 0.85],
              ['rodaIsiPilih', '94,208,255', 0.45],
              ['rodaGaris', '232,237,249', 0.75],
              ['rodaGarisPilih', '94,208,255', 1],
            ].map(([id, rgb, alfa]) => (
              <radialGradient key={id} id={id} gradientUnits="userSpaceOnUse" cx={pusat.x} cy={pusat.y} r={R_LUAR}>
                <stop offset={R_DALAM / R_LUAR} stopColor={`rgb(${rgb})`} stopOpacity={alfa} />
                <stop offset="1" stopColor={`rgb(${rgb})`} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>
          <circle cx={pusat.x} cy={pusat.y} r={R_DALAM} fill="none" stroke="rgba(232,237,249,0.7)" strokeWidth="2" />
          {urutanSektor.map((i) => (
            <path
              key={i}
              d={jalurSektor(pusat, i, pesanCepat.length)}
              fill={terpilih === i ? 'url(#rodaIsiPilih)' : 'url(#rodaIsi)'}
              stroke={terpilih === i ? 'url(#rodaGarisPilih)' : 'url(#rodaGaris)'}
              strokeWidth={terpilih === i ? 2.5 : 1.5}
              strokeLinejoin="round"
              
            />
          ))}
        </svg>

        {pesanCepat.map((teks, i) => {
          const titik = titikRoda(pusat, R_LABEL, (2 * Math.PI * i) / pesanCepat.length)
          return (
            <div
              key={teks}
              style={{
                ...(terpilih === i ? s.labelAktif : s.label),
                left: titik.x - LEBAR_LABEL / 2,
                top: titik.y - TINGGI_LABEL / 2,
              }}
            >
              {teks}
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  )
}

const labelDasar = {
  position: 'absolute',
  width: LEBAR_LABEL,
  height: TINGGI_LABEL,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.15,
  pointerEvents: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  transition: 'color 0.12s ease, transform 0.12s ease',
}

const s = {
  lapis: { position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' },
  isi: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  svg: { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' },
  label: { ...labelDasar, color: 'var(--text)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' },
  labelAktif: {
    ...labelDasar,
    color: 'var(--glow-blue)',
    textShadow: '0 0 8px rgba(94,208,255,0.9)',
    transform: 'scale(1.1)',
  },
}
