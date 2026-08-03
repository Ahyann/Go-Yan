import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { STATUS_PERMINTAAN } from '../lib/constants'
import { useLokasiOjek } from '../lib/useLokasiOjek'

const PUSAT_DEFAULT = [-6.2088, 106.8456]

// Batas area yang boleh digeser — kira-kira mencakup Jabodetabek,
// biar gak bisa digeser sampai nemu area kosong di luar situ.
const BATAS_PETA = [
  [-11.5, 94.5],  // pojok barat daya (dekat Aceh/Sumatera)
  [6.5, 141.5],   // pojok timur laut (dekat Papua)
]

const ikonOjek = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#E23636;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function GeserKePosisi({ lat, lng }) {
  const map = useMap()
  map.setView([lat, lng])
  return null
}

export default function PetaStatus({ permintaan }) {
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

        <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />

        {adaLokasiLive && (
          <>
            <GeserKePosisi lat={lokasiOjek.lat} lng={lokasiOjek.lng} />
            <Marker position={[lokasiOjek.lat, lokasiOjek.lng]} icon={ikonOjek} />
          </>
        )}
      </MapContainer>

      <div style={s.tint} />

      <div style={s.overlay}>
        {!permintaan && <div style={s.badgeIdle}>Belum ada perjalanan aktif</div>}

        {permintaan?.status === STATUS_PERMINTAAN.MENUNGGU && (
          <div style={s.badgeMenunggu}>
            <span style={s.dotKuning} />Menunggu Ahyan menerima…
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