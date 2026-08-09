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

  const tanggalFormatted = new Date(data.tanggal).toLocaleDateString(
    lang === 'id' ? 'id-ID' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  )

  return createPortal(
    <div style={s.wrapLuar}>
      <div style={{ ...s.card, ...(tampil ? s.cardTampil : s.cardSembunyi) }}>
        <div style={s.ikonWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--signal)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-6" />
          </svg>
        </div>
        <div style={s.isi}>
          <div style={s.judul}>{t.selesaiJudul}</div>
          <div style={s.tanggal}>{tanggalFormatted}</div>
          <div style={s.tarif}>{formatRupiah(data.tarif)}</div>
        </div>
        <button style={s.okeBtn} onClick={handleOkeDitekan}>{t.selesaiOke}</button>
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
  card: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 420,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--glow-blue-mid)',
    borderRadius: 16,
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(94,208,255,0.25)',
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
  ikonWrap: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'rgba(74,222,128,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  isi: { flex: 1, minWidth: 0 },
  judul: { fontSize: 14, fontWeight: 700, color: 'var(--text)' },
  tanggal: { fontSize: 12, color: '#9FC3E8', marginTop: 2 },
  tarif: {
    fontFamily: 'var(--font-data)',
    fontWeight: 700,
    fontSize: 17,
    color: 'var(--glow-blue)',
    textShadow: '0 0 6px var(--glow-blue-mid)',
    marginTop: 4,
  },
  okeBtn: {
    flexShrink: 0,
    background: 'rgba(94,208,255,0.15)',
    color: 'var(--glow-blue)',
    fontSize: 13,
    fontWeight: 600,
    padding: '9px 16px',
    borderRadius: 999,
    border: '1px solid var(--glow-blue-mid)',
  },
}