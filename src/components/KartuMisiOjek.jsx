import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AKSI } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useProfilIkon } from '../lib/useProfilIkon'
import { usePesanOjek } from '../lib/usePesanOjek'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { useRiwayatChat } from '../lib/useRiwayatChat'
import TombolFoto from './TombolFoto.jsx'
import TombolSuara from './TombolSuara.jsx'
import PemutarSuara from './PemutarSuara.jsx'

function formatJam(ms) {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Kartu misi berjalan di akun ojek, dibuat sama dengan kartu di akun penumpang: strip status yang bisa dibuka
// (info misi + share lokasi, kolom ketik, foto, suara, kirim) dan kotak CHAT di kanan atas peta.
// Dipasang di dalam area peta. Tombol Selesai ada di konsol bawah.
const SLOT_CHAT = ['kanan-atas', 'kanan-bawah', 'kiri-bawah']
const KUNCI_SLOT_CHAT = 'goyan:slot-chat'
const ASAL_TRANSFORM = { 'kanan-atas': 'top right', 'kanan-bawah': 'bottom right', 'kiri-bawah': 'bottom left' }

function bacaSlotChat() {
  try {
    const nilai = localStorage.getItem(KUNCI_SLOT_CHAT)
    return SLOT_CHAT.includes(nilai) ? nilai : 'kanan-atas'
  } catch {
    return 'kanan-atas'
  }
}

// bawah: tinggi dasar peta yang tertutup kartu, supaya pojok bawah ikut naik-turun bersama kartu.
function gayaSlot(slot, bawah) {
  const atas = slot === 'kanan-atas'
  const kiri = slot === 'kiri-bawah'
  return {
    top: atas ? 14 : 'auto',
    bottom: atas ? 'auto' : bawah + 8,
    left: kiri ? 14 : 'auto',
    right: kiri ? 'auto' : 14,
    transition: 'bottom 0.2s ease-out',
  }
}

export default function KartuMisiOjek({ permintaan, lokasiAktif, mulaiLokasi, berhentiLokasi, onBawah }) {
  const { t } = useLanguage()
  const { isDemo } = useAuth()
  const { ikonFajri } = useProfilIkon()
  const { pesan, kirimPesan, kirimFoto, kirimSuara } = usePesanOjek()
  const { pesan: pesanFajri } = usePesanPenumpang()
  const riwayatChat = useRiwayatChat(pesan, pesanFajri)
  const [kartuBuka, setKartuBuka] = useState(true)
  const [chatBuka, setChatBuka] = useState(true)
  const [kosongDibuka, setKosongDibuka] = useState(false)
  const [teksPesan, setTeksPesan] = useState('')
  const chatRef = useRef(null)
  const kartuRef = useRef(null)
  const [bawahTertutup, setBawahTertutup] = useState(0)
  const [slotChat, setSlotChat] = useState(bacaSlotChat)
  const [seret, setSeret] = useState(null)
  const slotRefs = useRef({})
  const tahanRef = useRef(null)
  const awalTahanRef = useRef(null)
  const sedangSeretRef = useRef(false)
  const sorotRef = useRef('kanan-atas')
  const baruSeretRef = useRef(false)
  const gelembungRef = useRef(null)

  // Tinggi kartu (plus jarak 14px) dilaporkan ke peta dan dipakai pojok bawah chat.
  useLayoutEffect(() => {
    const el = kartuRef.current
    if (!el) return undefined
    const ukur = () => {
      const b = Math.round(el.offsetHeight) + 14
      setBawahTertutup(b)
      if (onBawah) onBawah(b)
    }
    ukur()
    const pengamat = new ResizeObserver(ukur)
    pengamat.observe(el)
    return () => {
      pengamat.disconnect()
      if (onBawah) onBawah(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function slotTerdekat(x, y) {
    let terbaik = slotChat
    let jarakMin = Infinity
    SLOT_CHAT.forEach((slot) => {
      const rect = slotRefs.current[slot]?.getBoundingClientRect()
      if (!rect) return
      const jarak = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2))
      if (jarak < jarakMin) { jarakMin = jarak; terbaik = slot }
    })
    return terbaik
  }
  function mulaiTahan(e) {
    if (e.button != null && e.button !== 0) return
    const el = e.currentTarget
    const pointerId = e.pointerId
    awalTahanRef.current = { x: e.clientX, y: e.clientY }
    // Tahan lama di iPhone memunculkan menu salin/tempel; pemilihan teks dimatikan selama ikon ditahan.
    document.body.classList.add('tanpa-pilih')
    window.getSelection?.()?.removeAllRanges()
    clearTimeout(tahanRef.current)
    tahanRef.current = setTimeout(() => {
      try { el.setPointerCapture(pointerId) } catch { /* pointer sudah lepas */ }
      if (navigator.vibrate) navigator.vibrate(15)
      sedangSeretRef.current = true
      sorotRef.current = slotChat
      setSeret({ sorot: slotChat })
    }, 350)
  }
  function geserTahan(e) {
    if (!sedangSeretRef.current) {
      const awal = awalTahanRef.current
      if (awal && Math.hypot(e.clientX - awal.x, e.clientY - awal.y) > 10) clearTimeout(tahanRef.current)
      return
    }
    const awal = awalTahanRef.current
    if (gelembungRef.current) gelembungRef.current.style.transform = `translate3d(${e.clientX - awal.x}px, ${e.clientY - awal.y}px, 0)`
    const sorot = slotTerdekat(e.clientX, e.clientY)
    if (sorot !== sorotRef.current) {
      if (navigator.vibrate) navigator.vibrate(8)
      sorotRef.current = sorot
      setSeret({ sorot })
    }
  }
  function lepasTahan() {
    clearTimeout(tahanRef.current)
    document.body.classList.remove('tanpa-pilih')
    if (!sedangSeretRef.current) return
    sedangSeretRef.current = false
    baruSeretRef.current = true
    setTimeout(() => { baruSeretRef.current = false }, 350)
    const tujuan = sorotRef.current
    if (gelembungRef.current) gelembungRef.current.style.transform = ''
    setSlotChat(tujuan)
    try { localStorage.setItem(KUNCI_SLOT_CHAT, tujuan) } catch { /* abaikan */ }
    setSeret(null)
  }
  function klikGelembung() {
    if (baruSeretRef.current) return
    setChatBuka(true)
    setKosongDibuka(true)
  }

  const bisaPesan = lokasiAktif || isDemo
  const labelShare = lokasiAktif ? t.ariaMatikanShare : (isDemo ? t.ariaNyalakanShareDemo : t.ariaNyalakanShare)
  const idTerakhir = riwayatChat[riwayatChat.length - 1]?.id

  useEffect(() => {
    const el = chatRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [idTerakhir, chatBuka])

  function handleKirim() {
    const teks = teksPesan.trim()
    if (!teks || !bisaPesan) return
    Promise.resolve(kirimPesan(teks)).catch((err) => console.error('Gagal kirim pesan:', err))
    setTeksPesan('')
  }

  const kotakTerbuka = chatBuka && (riwayatChat.length > 0 || kosongDibuka)

  return (
    <>
      {(kotakTerbuka ? (
        <div className="chat-buka" style={{ ...s.kotakChat, ...gayaSlot(slotChat, bawahTertutup), transformOrigin: ASAL_TRANSFORM[slotChat] }}>
          <div style={s.kotakChatKepala}>
            <span style={s.kotakChatJudul}>{t.judulChat}</span>
            <button className="tekan" style={s.kotakChatX} onClick={() => setChatBuka(false)} aria-expanded="true" aria-label={t.ariaBukaChat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div ref={chatRef} className="no-scrollbar" style={s.kotakChatIsi} role="log" aria-live="polite">
            {riwayatChat.length === 0 && (
              <div style={s.chatKosong}>
                <div>
                  <div style={s.chatKosongJudul}>{t.chatKosong}</div>
                  <div style={s.chatKosongInfo}>{t.chatKosongInfo}</div>
                </div>
              </div>
            )}
            {riwayatChat.map((p) => (
              <div key={p.id} style={{ ...s.chatBaris, ...(typeof p.suara === 'string' ? { flexWrap: 'wrap', rowGap: 0 } : null) }}>
                <span style={s.chatTeks}>
                  <span style={p.siapa === 'ojek' ? s.chatNamaOjek : s.chatNamaSaya}>
                    {p.siapa === 'ojek' ? (isDemo ? 'Driver' : 'Ahyan') : (isDemo ? 'Passenger' : 'Fajri')}
                  </span>
                  <span style={s.chatTitikDua}>: </span>
                  {typeof p.suara === 'string' ? null : p.suara ? t.chatSuara : typeof p.foto === 'string' ? <img src={p.foto} alt={t.chatFoto} style={s.chatFotoMini} /> : p.foto ? t.chatFoto : p.teks}
                </span>
                <span style={s.chatJam}>{formatJam(p.waktu)}</span>
                {typeof p.suara === 'string' && (
                  <span style={s.chatSuaraBaris}><PemutarSuara src={p.suara} durasi={p.durasi} /></span>
                )}
              </div>
            ))}
          </div>
          {/* Baris kirim pesan di dalam kotak chat: ketik dan kirim. Kamera dan suara ada di konsol bawah. */}
          <div style={s.barisKirim}>
            <input
              className="input-pesan"
              style={{ ...s.inputKecil, opacity: bisaPesan ? 1 : 0.5 }}
              value={teksPesan}
              onChange={(e) => setTeksPesan(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleKirim() }}
              placeholder={t.placeholderKetik}
              aria-label={t.tombolKirimPesan}
              maxLength={24}
              disabled={!bisaPesan}
            />
            <button className="tekan" style={{ ...s.kirimKecil, opacity: bisaPesan && teksPesan.trim() ? 1 : 0.5 }} onClick={handleKirim} disabled={!bisaPesan || !teksPesan.trim()} aria-label={t.kirim}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          {!bisaPesan && <div style={s.hintKecil}>{t.pesanPerluLive}</div>}
        </div>
      ) : (
        <>
          <button
            ref={gelembungRef}
            className={seret ? undefined : 'tekan'}
            style={{
              ...s.tombolGelembung,
              ...gayaSlot(slotChat, bawahTertutup),
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              ...(seret ? { zIndex: 1200, borderColor: 'var(--glow-blue)', willChange: 'transform', transition: 'none' } : null),
            }}
            onClick={klikGelembung}
            onPointerDown={mulaiTahan}
            onPointerMove={geserTahan}
            onPointerUp={lepasTahan}
            onPointerCancel={lepasTahan}
            onContextMenu={(e) => e.preventDefault()}
            aria-expanded="false"
            aria-label={t.ariaBukaChat}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
              <path d="M4 5h16v11H9l-5 4z" />
            </svg>
          </button>
          {seret && SLOT_CHAT.map((slot) => (
            <div
              key={slot}
              ref={(el) => { slotRefs.current[slot] = el }}
              aria-hidden="true"
              style={{
                position: 'absolute', zIndex: 1090, width: 48, height: 48, boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--glow-blue)',
                border: seret.sorot === slot ? '1px solid var(--glow-blue)' : '1px dashed rgba(94,208,255,0.35)',
                background: seret.sorot === slot ? 'rgba(94,208,255,0.18)' : 'transparent',
                boxShadow: seret.sorot === slot ? '0 0 14px rgba(94,208,255,0.55)' : 'none',
                transition: 'background 0.12s, box-shadow 0.12s, border-color 0.12s',
                pointerEvents: 'none',
                ...gayaSlot(slot, bawahTertutup),
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ opacity: seret.sorot === slot ? 1 : 0.35 }}>
                <path d="M4 5h16v11H9l-5 4z" />
              </svg>
            </div>
          ))}
        </>
      ))}

    </>
  )
}

const kotak36 = { width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }

const s = {
  barisKirim: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 },
  inputKecil: { flex: 1, minWidth: 0, height: 28, boxSizing: 'border-box', background: 'rgba(2,18,29,0.85)', border: '1px solid #2F7FAF', borderRadius: 0, padding: '0 6px', fontSize: 16, color: 'var(--text)', transform: 'none' },
  kecilkan: { display: 'inline-flex', flexShrink: 0, zoom: 0.78 },
  kirimKecil: { width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'var(--nav-red)' },
  hintKecil: { fontSize: 10, color: 'var(--text-dim)', marginTop: 4 },
  kartu: { position: 'absolute', left: 14, right: 14, bottom: 14, zIndex: 1100, background: 'var(--panel)', color: 'var(--text)' },
  kartuBuka: { borderTop: '3px solid var(--nav-red)' },
  strip: { width: '100%', minHeight: 40, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 13.5, fontWeight: 600, textAlign: 'left' },
  stripKiri: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  dotHijau: { width: 8, height: 8, borderRadius: '50%', background: 'var(--signal)', flexShrink: 0 },
  avatar: { flexShrink: 0, width: 22, height: 22, objectFit: 'contain' },
  isi: { padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 },
  detail: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' },
  chipAksi: { flexShrink: 0, fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', background: 'var(--nav-red)', color: '#fff', padding: '2px 6px' },
  tempat: { display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, fontWeight: 600 },
  tempatTeks: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  jam: { marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 700, color: 'var(--glow-blue)' },
  pesanRow: { display: 'flex', gap: 6, position: 'relative' },
  share: { ...kotak36, color: 'var(--glow-blue)', border: '1px solid var(--blue-border)' },
  shareAktif: { ...kotak36, color: '#fff', background: 'var(--nav-red)' },
  pesanInput: { flex: 1, minWidth: 0, height: 36, boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--blue-border)', borderRadius: 0, padding: '0 12px', fontSize: 16, color: 'var(--text)' },
  kirimBtn: { ...kotak36, color: '#fff', background: 'var(--nav-red)' },
  hint: { fontSize: 11.5, color: 'var(--text-dim)', textAlign: 'center' },
  kotakChat: { position: 'absolute', width: 'min(200px, 62%)', zIndex: 1100, boxSizing: 'border-box', background: 'rgba(1,42,64,0.45)', border: '1px solid rgba(96, 192, 240, 0.25)', padding: '0 8px 6px' },
  kotakChatKepala: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 40 },
  kotakChatJudul: { fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--glow-blue)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' },
  kotakChatX: { width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', background: 'rgba(1, 42, 64, 0.6)' },
  tombolGelembung: { position: 'absolute', zIndex: 1100, width: 48, height: 48, background: 'rgba(1,42,64,0.45)', border: '1px solid rgba(96, 192, 240, 0.25)', color: 'var(--glow-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kotakChatIsi: { maxHeight: 'min(112px, 16vh)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' },
  chatBaris: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, fontSize: 12, lineHeight: 1.3, color: 'var(--text)', textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)' },
  chatTeks: { minWidth: 0, overflowWrap: 'anywhere' },
  chatJam: { flexShrink: 0, fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-dim)', paddingTop: 2 },
  chatNamaOjek: { fontWeight: 700, color: 'var(--merah-teks)' },
  chatNamaSaya: { fontWeight: 700, color: 'var(--glow-blue)' },
  chatTitikDua: { color: 'var(--text-dim)' },
  chatKosong: { display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0 4px', color: 'var(--text-dim)' },
  chatKosongJudul: { fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)' },
  chatKosongInfo: { fontSize: 11, lineHeight: 1.35, marginTop: 3, color: 'var(--text-dim)' },
  chatSuaraBaris: { flexBasis: '100%', marginTop: 1 },
  chatFotoMini: { display: 'block', marginTop: 4, maxWidth: '100%', maxHeight: 84, objectFit: 'cover', border: '1px solid rgba(96, 192, 240, 0.4)' },
}
