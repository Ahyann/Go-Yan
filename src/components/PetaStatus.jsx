import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { STATUS_PERMINTAAN } from '../lib/constants'

const PUSAT_DEFAULT = [-6.2088, 106.8456]

export default function PetaStatus({ permintaan }) {
  return (
    <div style={s.wrap}>
      <MapContainer
        center={PUSAT_DEFAULT}
        zoom={13}
        style={s.map}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      </MapContainer>

      <div style={s.overlay}>
        {!permintaan && <div style={s.badgeIdle}>Belum ada perjalanan aktif</div>}

        {permintaan?.status === STATUS_PERMINTAAN.MENUNGGU && (
          <div style={s.badgeMenunggu}>
            <span style={s.dotKuning} />Menunggu Ahyan menerima…
          </div>
        )}

        {permintaan?.status === STATUS_PERMINTAAN.DITERIMA && (
          <div style={s.badgeLive}>
            <span style={s.dotHijau} />
            Ahyan otw {permintaan.aksi === 'jemput' ? 'menjemput' : 'mengantar'} kamu
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  wrap: { position: 'absolute', inset: 0 },
  map: { height: '100%', width: '100%' },
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 'calc(var(--safe-bottom) + 100px)',
    zIndex: 1000,
  },
  badgeIdle: {
    background: 'rgba(11,14,26,0.9)', color: 'var(--text-dim)', fontSize: 13,
    padding: '10px 14px', borderRadius: 999, textAlign: 'center',
    border: '1px solid var(--line)',
  },
  badgeMenunggu: {
    background: 'rgba(11,14,26,0.95)', color: 'var(--text)', fontSize: 13,
    padding: '10px 14px', borderRadius: 999, textAlign: 'center',
    border: '1px solid var(--warn)',
  },
  dotKuning: { width: 7, height: 7, borderRadius: '50%', background: 'var(--warn)', display: 'inline-block', marginRight: 6 },
  dotHijau: { width: 7, height: 7, borderRadius: '50%', background: 'var(--signal)', display: 'inline-block', marginRight: 6 },
  badgeLive: {
    background: 'rgba(11,14,26,0.95)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600,
    padding: '10px 14px', borderRadius: 999, textAlign: 'center',
    border: '1px solid var(--signal)',
  },
}