import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

export default function PetaLokasiPenumpang({ lokasi }) {
  if (!lokasi) {
    return (
      <div style={s.kosong}>
        Fajri belum nyalain share lokasi.
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <MapContainer
        center={[lokasi.lat, lokasi.lng]}
        zoom={16}
        style={s.map}
        zoomControl={false}
        attributionControl={false}
        dragging={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          url={`https://api.maptiler.com/maps/streets-v4-dark/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
        />
        <GeserKePosisi lat={lokasi.lat} lng={lokasi.lng} />
        <Marker position={[lokasi.lat, lokasi.lng]} icon={ikonPenumpang} />
      </MapContainer>
      <div style={s.badge}>
        <span style={s.dot} />
        Lokasi Fajri live
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'relative',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--blue-border)',
  },
  map: { height: '100%', width: '100%' },
  kosong: {
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 12,
    color: 'var(--text-dim)',
    fontSize: 13.5,
    textAlign: 'center',
    padding: '0 20px',
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