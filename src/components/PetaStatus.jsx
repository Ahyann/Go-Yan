import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { STATUS_PERMINTAAN } from '../lib/constants'
import { useLokasiOjek } from '../lib/useLokasiOjek'

const PUSAT_DEFAULT = [-6.2088, 106.8456]

const BATAS_PETA = [
  [-11.5, 94.5],
  [6.5, 141.5],
]

const ikonOjek = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/spidericon.png" style="
      width:160px;height:160px;
      filter: drop-shadow(0 0 6px #5ED0FF) drop-shadow(0 0 12px #2B9EE8);
    " />
  </div>`,
  iconSize: [160, 160],
  iconAnchor: [80, 80],
})

function GeserKePosisi({ lat, lng }) {
  const map = useMap()
  map.setView([lat, lng])
  return null
}

function IkonLabaLaba() {
  return (
    <svg
      className="spider-loading"
      width="36" height="36" viewBox="0 0 24 24"
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

export default function PetaStatus({ permintaan, tampilkanOverlay = true }) {
  const lokasiOjek = useLokasiOjek()
  const adaLokasiLive = lokasiOjek && permintaan?.status === STATUS_PERMINTAAN.DITERIMA

  return (
    <div style={s.wrap}>
      <MapContainer
        center={PUSAT_DEFAULT}
        zoom={15}
        minZoom={5}
        maxBounds={BATAS_PETA}
        maxBoundsViscosity={1.0}
        style={s.map}
        zoomControl={false}
        attributionControl={false}
        dragging={true}
        scrollWheelZoom={true}
      >
        <ZoomControl position="topright" />

        <TileLayer
          url={`https://api.maptiler.com/maps/streets-v4-dark/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
        />

        {adaLokasiLive && (
          <>
            <GeserKePosisi lat={lokasiOjek.lat} lng={lokasiOjek.lng} />
            <Marker position={[lokasiOjek.lat, lokasiOjek.lng]} icon={ikonOjek} />
          </>
        )}
      </MapContainer>

      <div style={s.tint} />

      {tampilkanOverlay && (
        <div style={s.overlay}>
          {!permintaan && <div style={s.badgeIdle}>Belum ada perjalanan aktif</div>}

          {permintaan?.status === STATUS_PERMINTAAN.MENUNGGU && (
            <div style={s.badgeMenunggu}>
              <IkonLabaLaba />
              <div style={s.menungguText}>
                <span style={s.dotKuning} />Menunggu Ahyan menerima…
              </div>
            </div>
          )}

          {permintaan?.status === STATUS_PERMINTAAN.DITOLAK && (
            <div style={s.badgeTolak}>Ahyan belum bisa sekarang — coba GO lagi nanti</div>
          )}

          {permintaan?.status === STATUS_PERMINTAAN.DITERIMA && (
            <div style={s.badgeLive}>
              <span style={s.dotHijau} />
              {adaLokasiLive ? 'OTWWW!!' : `Ahyan otw ${permintaan.aksi === 'jemput' ? 'menjemput' : 'mengantar'} kamu`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { position: 'absolute', inset: 0 },
  map: { height: '100%', width: '100%' },
  tint: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'var(--glow-blue-mid)',
    opacity: 0.5,
    mixBlendMode: 'color',
    zIndex: 1000,
  },
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
    padding: '14px', borderRadius: 'var(--radius)', textAlign: 'center',
    border: '1px solid var(--warn)',
  },
  menungguText: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badgeTolak: {
    background: 'rgba(11,14,26,0.95)', color: 'var(--text-dim)', fontSize: 13,
    padding: '10px 14px', borderRadius: 999, textAlign: 'center',
    border: '1px solid var(--web-red)',
  },
  dotKuning: { width: 7, height: 7, borderRadius: '50%', background: 'var(--warn)', display: 'inline-block', marginRight: 6 },
  dotHijau: { width: 7, height: 7, borderRadius: '50%', background: 'var(--signal)', display: 'inline-block', marginRight: 6 },
  badgeLive: {
    background: 'rgba(11,14,26,0.95)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600,
    padding: '10px 14px', borderRadius: 999, textAlign: 'center',
    border: '1px solid var(--signal)',
  },
}