import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLokasiOjek } from '../lib/useLokasiOjek'

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

const ikonSaya = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/spidericon.png" style="
      width:24px;height:24px;
      image-rendering: pixelated;
      filter: drop-shadow(0 0 6px #5ED0FF) drop-shadow(0 0 10px #2B9EE8);
    " />
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function GeserKePosisi({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng])
  }, [lat, lng, map])
  return null
}

export default function PetaLokasiPenumpang({
  lokasi,
  teksKosong = 'Fajri belum nyalain share lokasi',
  isiPenuh = false,
  lokasiAktif,
  onToggleLokasi,
}) {
  const lokasiSaya = useLokasiOjek()
  const pusat = lokasi ? [lokasi.lat, lokasi.lng] : PUSAT_DEFAULT
  const tampilkanTombolLokasi = typeof onToggleLokasi === 'function'

  return (
    <div style={isiPenuh ? s.wrapPolos : s.wrap}>
      <MapContainer
        center={pusat}
        zoom={lokasi ? 16 : 13}
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

        {lokasi && (
          <>
            <GeserKePosisi lat={lokasi.lat} lng={lokasi.lng} />
            <Marker position={[lokasi.lat, lokasi.lng]} icon={ikonPenumpang} />
          </>
        )}

        {lokasiSaya && (
          <Marker position={[lokasiSaya.lat, lokasiSaya.lng]} icon={ikonSaya} />
        )}
      </MapContainer>

      {tampilkanTombolLokasi && (
        <button
          style={lokasiAktif ? s.lokasiIconAktif : s.lokasiIcon}
          onClick={onToggleLokasi}
          aria-label={lokasiAktif ? 'Matikan live location' : 'Nyalain live location'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </button>
      )}

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
  wrapPolos: {
    position: 'relative',
    height: '100%',
  },
  map: { height: '100%', width: '100%' },
  lokasiIcon: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#fff',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
    zIndex: 1000,
  },
  lokasiIconAktif: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#B8242F',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 10px #B8242F, 0 1px 5px rgba(0,0,0,0.4)',
    zIndex: 1000,
  },
  badgeKosong: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
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