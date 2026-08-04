import { STATUS_PERMINTAAN, AKSI } from '../lib/constants'
import { playSpiderSound } from '../lib/sound'
import { useLokasiSaya } from '../lib/useLokasiSaya'
import { useLokasiPenumpang } from '../lib/useLokasiPenumpang'
import PetaLokasiPenumpang from '../components/PetaLokasiPenumpang.jsx'

export default function OjekHomeTab({ permintaan, onTerima, onTolak, onSelesai }) {
  const adaPermintaanMasuk = permintaan?.status === STATUS_PERMINTAAN.MENUNGGU
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  const { aktif: lokasiAktif, error: lokasiError, mulai: mulaiLokasi, berhenti: berhentiLokasi } = useLokasiSaya()
  const lokasiPenumpang = useLokasiPenumpang()

  function handleTerima() {
    playSpiderSound()
    onTerima()
  }

  function handleSelesai() {
    berhentiLokasi()
    onSelesai()
  }

  const teksKosongPeta = adaPermintaanMasuk || sedangJalan
    ? 'Fajri belum nyalain share lokasi'
    : 'Belum ada permintaan masuk'

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>OJEK</div>
        <h1 style={s.title}>Halo, Ahyan</h1>
      </header>

      <section style={s.mainCard}>
        <div style={s.mapArea}>
          <PetaLokasiPenumpang lokasi={lokasiPenumpang} teksKosong={teksKosongPeta} isiPenuh />
        </div>

        {adaPermintaanMasuk && (
          <div style={s.bawahCard}>
            <div style={s.permintaanLabel}>Permintaan baru dari Fajri</div>
            <div style={s.permintaanAksi}>
              {permintaan.aksi === AKSI.JEMPUT ? 'Jemput' : 'Antar'} · {permintaan.waktu}
            </div>
            <div style={s.permintaanWhere}>{permintaan.where}</div>
            <div style={s.tombolRow}>
              <button style={s.tolakBtn} onClick={onTolak}>Tolak</button>
              <button style={s.terimaBtn} onClick={handleTerima}>Terima</button>
            </div>
          </div>
        )}

        {sedangJalan && (
          <div style={s.bawahCard}>
            <div style={s.jalanRow}>
              <span style={s.dotHijau} />
              Sedang {permintaan.aksi === AKSI.JEMPUT ? 'menjemput' : 'mengantar'} Fajri · {permintaan.where}
            </div>

            <button
              style={lokasiAktif ? s.lokasiBtnAktif : s.lokasiBtn}
              onClick={lokasiAktif ? berhentiLokasi : mulaiLokasi}
            >
              {lokasiAktif ? '● Live location aktif — tekan buat matikan' : 'Nyalain live location'}
            </button>
            {lokasiError && <div style={s.lokasiError}>{lokasiError}</div>}

            <button style={s.selesaiBtn} onClick={handleSelesai}>
              Selesai
            </button>
          </div>
        )}
      </section>
    </main>
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
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
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
  lokasiBtn: {
    background: 'rgba(255,255,255,0.06)',
    color: '#8FB4DC',
    fontSize: 13.5,
    fontWeight: 600,
    padding: '12px',
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
  lokasiBtnAktif: {
    background: 'rgba(94,208,255,0.12)',
    color: 'var(--glow-blue)',
    fontSize: 13.5,
    fontWeight: 600,
    padding: '12px',
    borderRadius: 999,
    border: '1px solid var(--glow-blue-mid)',
    textShadow: '0 0 4px var(--glow-blue-mid)',
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