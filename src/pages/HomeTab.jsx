import { STATUS_PERMINTAAN } from '../lib/constants'
import { useLokasiSayaPenumpang } from '../lib/useLokasiSayaPenumpang'
import PetaStatus from '../components/PetaStatus.jsx'

export default function HomeTab({ permintaan }) {
  const { aktif: lokasiAktif, error: lokasiError, mulai: mulaiLokasi, berhenti: berhentiLokasi } = useLokasiSayaPenumpang()
  const sedangJalan = permintaan?.status === STATUS_PERMINTAAN.DITERIMA

  return (
    <div style={s.wrap}>
      <div style={s.headerFloat}>
        <div style={s.eyebrow}>PENUMPANG</div>
        <h1 style={s.title}>Halo, Fajri</h1>
      </div>

      {sedangJalan && (
        <div style={s.shareFloat}>
          <button
            style={lokasiAktif ? s.shareBtnAktif : s.shareBtn}
            onClick={lokasiAktif ? berhentiLokasi : mulaiLokasi}
          >
            {lokasiAktif ? '● Share lokasi aktif — tekan buat matikan' : 'Share lokasi ke Ahyan'}
          </button>
          {lokasiError && <div style={s.lokasiError}>{lokasiError}</div>}
        </div>
      )}

      <PetaStatus permintaan={permintaan} />
    </div>
  )
}

const s = {
  wrap: {
    position: 'relative',
    height: '100%',
    maxWidth: 480,
    margin: '0 auto',
    overflow: 'hidden',
  },
  headerFloat: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 16px)',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  eyebrow: {
    fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4,
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 26,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
    textShadow: '0 1px 6px rgba(0,0,0,0.8)',
  },
  shareFloat: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 76px)',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  shareBtn: {
    width: '100%',
    background: 'rgba(11,14,26,0.9)',
    color: 'var(--text)',
    fontSize: 13,
    fontWeight: 600,
    padding: '11px 14px',
    borderRadius: 999,
    border: '1px solid var(--blue-border)',
  },
  shareBtnAktif: {
    width: '100%',
    background: 'rgba(94,208,255,0.15)',
    color: 'var(--glow-blue)',
    fontSize: 13,
    fontWeight: 600,
    padding: '11px 14px',
    borderRadius: 999,
    border: '1px solid var(--glow-blue-mid)',
    textShadow: '0 0 4px var(--glow-blue-mid)',
  },
  lokasiError: { fontSize: 11.5, color: 'var(--web-red)', textAlign: 'center', marginTop: 6 },
}