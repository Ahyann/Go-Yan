import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const PUSAT_DEFAULT = [-6.2088, 106.8456]

const ikonPenumpang = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#2B6CE8;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function GeserKePosisi({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng])
  }, [lat, lng, map])
  return null
}

export default function PetaLokasiPenumpang({ lokasi, teksKosong = 'Fajri belum nyalain share lokasi', isiPenuh = false }) {
  const pusat = lokasi ? [lokasi.lat, lokasi.lng] : PUSAT_DEFAULT

  return (
    <div style={isiPenuh ? { ...s.wrap, height: '100%' } : s.wrap}>
      <MapContainer
        center={pusat}
        zoom={lokasi ? 16 : 13}
        style={s.map}
        zoomControl={false}
        attributionControl={false}
        dragging={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url={`https://api.maptiler.com/maps/streets-v4-dark/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
        />

        {lokasi && (
          <>
            <GeserKePosisi lat={lokasi.lat} lng={lokasi.lng} />
            <Marker position={[lokasi.lat, lokasi.lng]} icon={ikonPenumpang} />
          </>
        )}
      </MapContainer>

      {!lokasi && (
        <div style={s.badgeKosong}>{teksKosong}</div>
      )}

      {lokasi && (
        <div style={s.badge}>
          <span style={s.dot} />
          Lokasi Fajri live
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: {
    position: 'relative',
    height: 420,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--blue-border)',
  },
  map: { height: '100%', width: '100%' },
  badgeKosong: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    background: 'rgba(11,14,26,0.9)',
    color: 'var(--text-dim)',
    fontSize: 13,
    textAlign: 'center',
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid var(--line)',
    zIndex: 1000,
  },
  badge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    background: 'rgba(11,14,26,0.9)',
    color: 'var(--text)',
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    zIndex: 1000,
  },
  dot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--glow-blue)', boxShadow: '0 0 5px var(--glow-blue)',
  },
}