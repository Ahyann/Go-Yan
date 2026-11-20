import { useEffect, useRef, useState } from 'react'
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
export default function KartuMisiOjek({ permintaan, lokasiAktif, mulaiLokasi, berhentiLokasi }) {
  const { t } = useLanguage()
  const { isDemo } = useAuth()
  const { ikonFajri } = useProfilIkon()
  const { pesan, kirimPesan, kirimFoto, kirimSuara } = usePesanOjek()
  const { pesan: pesanFajri } = usePesanPenumpang()
  const riwayatChat = useRiwayatChat(pesan, pesanFajri)
  const [kartuBuka, setKartuBuka] = useState(true)
  const [chatBuka, setChatBuka] = useState(true)
  const [teksPesan, setTeksPesan] = useState('')
  const chatRef = useRef(null)

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

  const tampilChat = riwayatChat.length > 0

  return (
    <>
      {tampilChat && (chatBuka ? (
        <div className="chat-buka" style={s.kotakChat}>
          <div style={s.kotakChatKepala}>
            <span style={s.kotakChatJudul}>{t.judulChat}</span>
            <button className="tekan" style={s.kotakChatX} onClick={() => setChatBuka(false)} aria-expanded="true" aria-label={t.ariaBukaChat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div ref={chatRef} className="no-scrollbar" style={s.kotakChatIsi} role="log" aria-live="polite">
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
        </div>
      ) : (
        <button className="tekan" style={s.tombolGelembung} onClick={() => setChatBuka(true)} aria-expanded="false" aria-label={t.ariaBukaChat}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
            <path d="M4 5h16v11H9l-5 4z" />
          </svg>
        </button>
      ))}

      <div className="naik-masuk" style={{ ...s.kartu, ...(kartuBuka ? s.kartuBuka : null) }}>
        <button className="tekan" style={s.strip} onClick={() => setKartuBuka((b) => !b)} aria-expanded={kartuBuka} aria-label={t.ariaBukaDetailStatus}>
          <span style={s.stripKiri}>
            <span style={s.dotHijau} />
            <img src={`/icons/${ikonFajri}`} style={s.avatar} alt="" />
            <span>{permintaan.aksi === AKSI.JEMPUT ? t.sedangMenjemput : t.sedangMengantar} {isDemo ? t.namaDemo : 'Fajri'}</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow-blue)" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true" style={{ transform: kartuBuka ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
            <path d="M6 15l6-6 6 6" />
          </svg>
        </button>
        {kartuBuka && (
          <div className="naik-masuk" style={s.isi}>
            <div style={s.detail}>
              <span style={s.chipAksi}>{String(permintaan.aksi === AKSI.JEMPUT ? t.jemput : t.antar).toUpperCase()}</span>
              {permintaan.where && (
                <span style={s.tempat}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <span style={s.tempatTeks}>{permintaan.where}</span>
                </span>
              )}
              {permintaan.waktu && (
                <span style={s.jam}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  {permintaan.waktu}
                </span>
              )}
            </div>
            <div style={s.pesanRow}>
              <button className="tekan" style={lokasiAktif ? s.shareAktif : s.share} onClick={lokasiAktif ? berhentiLokasi : mulaiLokasi} aria-label={labelShare} aria-pressed={lokasiAktif}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
                  <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </button>
              <input
                className="input-pesan"
                style={{ ...s.pesanInput, opacity: bisaPesan ? 1 : 0.5 }}
                value={teksPesan}
                onChange={(e) => setTeksPesan(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleKirim() }}
                placeholder={t.placeholderKetik}
                aria-label={t.tombolKirimPesan}
                maxLength={24}
                disabled={!bisaPesan}
              />
              <TombolFoto onKirimFoto={kirimFoto} disabled={!bisaPesan} />
              <TombolSuara onKirimSuara={kirimSuara} disabled={!bisaPesan} />
              <button className="tekan" style={{ ...s.kirimBtn, opacity: bisaPesan && teksPesan.trim() ? 1 : 0.5 }} onClick={handleKirim} disabled={!bisaPesan || !teksPesan.trim()} aria-label={t.kirim}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            {!bisaPesan && <div style={s.hint}>{t.pesanPerluLive}</div>}
          </div>
        )}
      </div>
    </>
  )
}

const kotak36 = { width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }

const s = {
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
  kotakChat: { position: 'absolute', top: 14, right: 14, width: 'min(172px, 46%)', zIndex: 1100, boxSizing: 'border-box', background: 'rgba(1,42,64,0.45)', border: '1px solid rgba(96, 192, 240, 0.25)', padding: '0 8px 6px' },
  kotakChatKepala: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 40 },
  kotakChatJudul: { fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--glow-blue)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' },
  kotakChatX: { width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', background: 'rgba(1, 42, 64, 0.6)' },
  tombolGelembung: { position: 'absolute', top: 14, right: 14, zIndex: 1100, width: 48, height: 48, background: 'rgba(1,42,64,0.45)', border: '1px solid rgba(96, 192, 240, 0.25)', color: 'var(--glow-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kotakChatIsi: { maxHeight: 'min(112px, 16vh)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' },
  chatBaris: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, fontSize: 12, lineHeight: 1.3, color: 'var(--text)', textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)' },
  chatTeks: { minWidth: 0, overflowWrap: 'anywhere' },
  chatJam: { flexShrink: 0, fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-dim)', paddingTop: 2 },
  chatNamaOjek: { fontWeight: 700, color: 'var(--merah-teks)' },
  chatNamaSaya: { fontWeight: 700, color: 'var(--glow-blue)' },
  chatTitikDua: { color: 'var(--text-dim)' },
  chatSuaraBaris: { flexBasis: '100%', marginTop: 1 },
  chatFotoMini: { display: 'block', marginTop: 4, maxWidth: '100%', maxHeight: 84, objectFit: 'cover', border: '1px solid rgba(96, 192, 240, 0.4)' },
}
