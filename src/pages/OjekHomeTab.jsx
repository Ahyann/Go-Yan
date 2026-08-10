import { useState } from 'react'
import { STATUS_PERMINTAAN, AKSI } from '../lib/constants'
import { playSpiderSound } from '../lib/sound'
import { useLokasiPenumpang, hapusLokasiPenumpangSekarang } from '../lib/useLokasiPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import { useLanguage } from '../context/LanguageContext.jsx'
import PetaLokasiPenumpang from '../components/PetaLokasiPenumpang.jsx'
import MissionSuccessPopup from '../components/MissionSuccessPopup.jsx'

export default function OjekHomeTab({
  permintaan,
  onTerima,
  onTolak,
  onSelesai,
  lokasiAktif,
  lokasiError,
  mulaiLokasi,
  berhentiLokasi,
}) {
  const { t } = useLanguage()
  const adaPermintaanMasuk = permintaan?.status === STATUS_PERMINTAAN.MENUNGGU
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  const lokasiPenumpang = useLokasiPenumpang()
  const { kirimPesan, hapusPesan } = usePesanOjek()
  const [teksPesan, setTeksPesan] = useState('')
  const [showMissionSuccess, setShowMissionSuccess] = useState(false)

  function handleKirimPesan() {
    if (!teksPesan.trim()) return
    kirimPesan(teksPesan)
    setTeksPesan('')
  }

  function handleTerima() {
    playSpiderSound()
    onTerima()
  }

  function handleSelesai() {
    berhentiLokasi()
    hapusLokasiPenumpangSekarang()
    hapusPesan()
    setShowMissionSuccess(true)
    onSelesai()
  }

  const teksKosongPeta = adaPermintaanMasuk || sedangJalan
    ? t.fajriBelumShare
    : t.belumAdaPermintaan

  return (
    <>
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>{t.ojekEyebrow}</div>
        <h1 style={s.title}>{t.ojekHalo}</h1>
      </header>

      <section style={s.mainCard}>
        <div style={s.mapArea}>
          <PetaLokasiPenumpang
            lokasi={lokasiPenumpang}
            teksKosong={teksKosongPeta}
            isiPenuh
            lokasiAktif={sedangJalan ? lokasiAktif : undefined}
            onToggleLokasi={sedangJalan ? (lokasiAktif ? berhentiLokasi : mulaiLokasi) : undefined}
          />
        </div>

        {adaPermintaanMasuk && (
          <div style={s.bawahCard}>
            <div style={s.misiBaruRow}>
              <div style={s.spiderDangle}>
                <div style={s.webThread} />
                <svg className="spider-swing" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--glow-blue)" strokeWidth="1.7" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px var(--glow-blue-mid))' }}>
                  <circle cx="12" cy="9.5" r="2.6" />
                  <circle cx="12" cy="15" r="3.6" />
                  <path d="M9 7.5 L4.5 5 M9 8.8 L3.5 8.8 M9 10.5 L4.5 12.5 M9 12.5 L5 15.5" />
                  <path d="M15 7.5 L19.5 5 M15 8.8 L20.5 8.8 M15 10.5 L19.5 12.5 M15 12.5 L19 15.5" />
                </svg>
              </div>
              <div style={s.misiBaruLabel}>{t.misiBaru}</div>
            </div>
            <div style={s.permintaanAksi}>
              {permintaan.aksi === AKSI.JEMPUT ? t.jemput : t.antar} · {permintaan.waktu}
            </div>
            <div style={s.permintaanWhere}>{permintaan.where}</div>
            <div style={s.tombolRow}>
              <button style={s.tolakBtn} onClick={onTolak}>{t.batalMisi}</button>
              <button style={s.terimaBtn} onClick={handleTerima}>{t.mulaiMisi}</button>
            </div>
          </div>
        )}

        {sedangJalan && (
          <div style={s.bawahCard}>
            <div style={s.jalanRow}>
              <span style={s.dotHijau} />
              {permintaan.aksi === AKSI.JEMPUT ? t.sedangMenjemput : t.sedangMengantar} Fajri · {permintaan.where} · {permintaan.waktu}
            </div>

            <div style={{ ...s.pesanRow, opacity: lokasiAktif ? 1 : 0.5 }}>
              <input
                style={s.pesanInput}
                value={teksPesan}
                onChange={(e) => setTeksPesan(e.target.value)}
                placeholder={t.placeholderPesanBubble}
                maxLength={24}
                disabled={!lokasiAktif}
              />
              <button style={s.pesanBtn} onClick={handleKirimPesan} disabled={!lokasiAktif}>{t.kirim}</button>
            </div>
            {!lokasiAktif && <div style={s.pesanHint}>{t.pesanPerluLive}</div>}

            {lokasiError && <div style={s.lokasiError}>{lokasiError}</div>}

            <button style={s.selesaiBtn} onClick={handleSelesai}>
              {t.selesai}
            </button>
          </div>
        )}
      </section>
    </main>

    {showMissionSuccess && (
      <MissionSuccessPopup onDismiss={() => setShowMissionSuccess(false)} />
    )}
    </>
  )
}

const s = {
  wrap: {
    height: '100%',
    padding: 'calc(var(--safe-top) + 24px) 20px 20px',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: { flexShrink: 0 },
  eyebrow: {
    fontSize: 11, letterSpacing: '0.12em', color: 'var(--glow-blue)', marginBottom: 4,
    textShadow: '0 0 6px var(--glow-blue-mid)',
    fontWeight: 700,
  },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 26,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
  },

  mainCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 0,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    minHeight: 200,
  },
  bawahCard: {
    flexShrink: 0,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    borderTop: '1px solid var(--blue-border)',
  },

  permintaanLabel: { fontSize: 13, color: '#9FC3E8' },
  misiBaruRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  spiderDangle: {
    position: 'relative',
    width: 30,
    height: 30,
    flexShrink: 0,
  },
  webThread: {
    position: 'absolute',
    top: -18,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 1,
    height: 18,
    background: 'linear-gradient(to bottom, transparent, var(--glow-blue-mid))',
  },
  misiBaruLabel: {
    fontFamily: 'var(--font-judul)',
    fontSize: 15,
    letterSpacing: '1px',
    color: 'var(--glow-blue)',
    textShadow: '0 0 8px var(--glow-blue-mid)',
  },
  permintaanAksi: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 20,
    color: 'var(--warn)', textShadow: '0 0 6px rgba(251,191,36,0.5)',
  },
  permintaanWhere: { fontSize: 14, color: '#8FB4DC' },
  tombolRow: { display: 'flex', gap: 10 },
  tolakBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
  terimaBtn: {
    flex: 1,
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    padding: '13px',
    borderRadius: 999,
  },

  jalanRow: { display: 'flex', alignItems: 'center', fontSize: 14.5, fontWeight: 600, color: 'var(--text)' },
  dotHijau: {
    width: 7, height: 7, borderRadius: '50%', background: 'var(--signal)',
    display: 'inline-block', marginRight: 8, boxShadow: '0 0 5px var(--signal)',
  },
  pesanRow: { display: 'flex', gap: 8 },
  pesanInput: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    color: 'var(--text)',
  },
  pesanBtn: {
    background: 'var(--glow-blue-mid)',
    color: '#fff',
    fontSize: 13.5,
    fontWeight: 600,
    padding: '10px 16px',
    borderRadius: 10,
  },
  pesanHint: {
    fontSize: 11.5,
    color: 'var(--text-dim)',
    textAlign: 'center',
    marginTop: -4,
  },
  lokasiError: { fontSize: 12, color: 'var(--web-red)', textAlign: 'center' },
  selesaiBtn: {
    background: 'var(--signal)',
    color: '#08130d',
    fontSize: 15,
    fontWeight: 700,
    padding: '13px',
    borderRadius: 999,
  },
}