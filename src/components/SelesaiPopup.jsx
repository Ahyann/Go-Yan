import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatRupiah } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import { playNotifSelesai } from '../lib/sound'

const DURASI_ANIMASI = 300

export default function SelesaiPopup({ data, onDismiss }) {
  const { t, lang } = useLanguage()
  const [tampil, setTampil] = useState(false)
  const sudahPutarSuara = useRef(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setTampil(true))

    playNotifSelesai().then((berhasil) => {
      sudahPutarSuara.current = berhasil
    })

    // Sengaja GAK ADA auto-timeout lagi — popup ini cuma bisa
    // ketutup lewat tombol Oke yang beneran ditekan user. Ini
    // ngejamin 100% gak akan ada lagi suara "nyangkut" buat dipaksa
    // mainin nanti, soalnya satu-satunya jalan nutup SELALU lewat
    // sentuhan user asli.
    return () => {
      cancelAnimationFrame(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleOkeDitekan() {
    if (!sudahPutarSuara.current) {
      playNotifSelesai()
      sudahPutarSuara.current = true
    }
    setTampil(false)
    setTimeout(() => {
      onDismiss()
    }, DURASI_ANIMASI)
  }

  const tanggalFormatted = new Date(data.tanggal)
    .toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/\./g, '')

  return createPortal(
    <div style={s.wrapLuar}>
      <div style={{ ...s.card, ...(tampil ? s.cardTampil : s.cardSembunyi) }}>
        <svg className="koin-putar" width="40" height="40" viewBox="0 0 10 10" shapeRendering="crispEdges" style={s.koin} aria-hidden="true">
          <path d="M3 0h4v1h2v2h1v4H9v2H7v1H3V9H1V7H0V3h1V1h2z" fill="#FACC15" />
          <path d="M3 1h4v1h1v1h1v4H8v1H7v1H3V8H2V7H1V3h1V2h1z" fill="#FDE68A" />
          <rect x="4" y="2" width="2" height="6" fill="#CA8A04" />
          <rect x="3" y="3" width="4" height="1" fill="#CA8A04" />
          <rect x="3" y="6" width="4" height="1" fill="#CA8A04" />
        </svg>
        <div style={s.isi}>
          <div style={s.judul}>
            {t.selesaiJudul} <span style={s.tanggal}>&middot; {tanggalFormatted}</span>
          </div>
          <div style={s.tarif}>{formatRupiah(data.tarif)}</div>
        </div>
        <button className="tekan tombol-oke" style={s.okeBtn} onClick={handleOkeDitekan}>{t.selesaiOke}</button>
      </div>
    </div>,
    document.body
  )
}

const s = {
  wrapLuar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    padding: '0 16px',
    paddingTop: 'calc(var(--safe-top) + 12px)',
    zIndex: 9999999,
    pointerEvents: 'none',
  },
  // Koin emas berputar di kiri, tarif besar berwarna emas, tombol OK kecil bergaris di kanan.
  card: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 420,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'var(--panel)',
    borderTop: '3px solid #FACC15',
    padding: '12px 14px',
    boxShadow: '4px 4px 0 rgba(0, 0, 0, 0.4)',
    transition: `transform ${DURASI_ANIMASI}ms ease, opacity ${DURASI_ANIMASI}ms ease`,
  },
  cardSembunyi: {
    transform: 'translateY(-140%)',
    opacity: 0,
  },
  cardTampil: {
    transform: 'translateY(0)',
    opacity: 1,
  },
  koin: { flexShrink: 0, display: 'block' },
  isi: { flex: 1, minWidth: 0 },
  judul: { fontSize: 12, color: 'var(--text-dim)' },
  tanggal: { fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' },
  tarif: { fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 26, color: '#FDE68A', lineHeight: 1.1, marginTop: 2 },
  okeBtn: {
    flexShrink: 0,
    height: 32,
    padding: '0 14px',
    background: 'transparent',
    color: 'var(--glow-blue)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    border: '1px solid var(--glow-blue)',
    borderRadius: 0,
  },
}
