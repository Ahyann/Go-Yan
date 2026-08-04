import { STATUS_PERMINTAAN, AKSI } from '../lib/constants'
import { playSpiderSound } from '../lib/sound'
import { useLokasiSaya } from '../lib/useLokasiSaya'
import { useLokasiPenumpang } from '../lib/useLokasiPenumpang'
import PetaLokasiPenumpang from '../components/PetaLokasiPenumpang.jsx'
import PetaStatus from '../components/PetaStatus.jsx'

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

  return (
    <main style={s.wrap}>
      <header style={s.header}>
        <div style={s.eyebrow}>OJEK</div>
        <h1 style={s.title}>Halo, Ahyan</h1>
      </header>

      <section style={s.petaCard}>
        <PetaStatus permintaan={permintaan} tampilkanBadgeIdle={false} />
      </section>

      {adaPermintaanMasuk && (
        <section style={s.permintaanCard}>
          <IkonLabaLaba />
          <div style={s.permintaanLabel}>Permintaan baru dari Fajri</div>
          <div style={s.permintaanAksi}>
            {permintaan.aksi === AKSI.JEMPUT ? 'Jemput' : 'Antar'} · {permintaan.waktu}
          </div>
          <div style={s.permintaanWhere}>{permintaan.where}</div>
          <div style={s.tombolRow}>
            <button style={s.tolakBtn} onClick={onTolak}>Tolak</button>
            <button style={s.terimaBtn} onClick={handleTerima}>Terima</button>
          </div>
        </section>
      )}

      {sedangJalan && (
        <section style={s.jalanCard}>
          <div style={s.jalanRow}>
            <span style={s.dotHijau} />
            Sedang {permintaan.aksi === AKSI.JEMPUT ? 'menjemput' : 'mengantar'} Fajri · {permintaan.where}
          </div>

          <PetaLokasiPenumpang lokasi={lokasiPenumpang} />

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
        </section>
      )}

      {!adaPermintaanMasuk && !sedangJalan && (
        <section style={s.idleCard}>Belum ada permintaan masuk.</section>
      )}
    </main>
  )
}

function IkonLabaLaba() {
  return (
    <svg
      className="spider-loading"
      width="44" height="44" viewBox="0 0 24 24"
      fill="none" stroke="var(--glow-blue)" strokeWidth="1.6" strokeLinecap="round"
      style={{ display: 'block', margin: '0 auto 4px' }}
    >
      <circle cx="12" cy="10" r="3" />
      <circle cx="12" cy="15.5" r="4" />
      <path d="M9 8 L4 5 M9 9.5 L3 9.5 M9 11.5 L4 13.5 M9 13.5 L5 16.5" />
      <path d="M15 8 L20 5 M15 9.5 L21 9.5 M15 11.5 L20 13.5 M15 13.5 L19 16.5" />
    </svg>
  )
}

const s = {
  wrap: {
    minHeight: '100%',
    padding: 'calc(var(--safe-top) + 24px) 20px 110px',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {},
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 26,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
  },
  petaCard: {
    position: 'relative',
    height: 340,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--blue-border)',
  },
  permintaanCard: {
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--warn)',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center',
  },
  permintaanLabel: { fontSize: 13, color: '#9FC3E8', marginBottom: 6 },
  permintaanAksi: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 20,
    color: 'var(--warn)', textShadow: '0 0 6px rgba(251,191,36,0.5)',
  },
  permintaanWhere: { fontSize: 14, color: '#8FB4DC', marginTop: 4, marginBottom: 16 },
  tombolRow: { display: 'flex', gap: 10, textAlign: 'initial' },
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

  jalanCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--signal)',
    borderRadius: 12,
    padding: '16px',
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

  idleCard: {
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 12,
    padding: 20,
    color: '#8FB4DC',
    fontSize: 14,
    textAlign: 'center',
  },
}