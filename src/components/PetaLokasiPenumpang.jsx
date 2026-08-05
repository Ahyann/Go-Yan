import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLokasiOjek } from '../lib/useLokasiOjek'
import { LOKASI_OFFICE } from '../lib/constants'

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

const ikonOffice = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/office.png" style="
      width:44px;height:44px;
      image-rendering: pixelated;
    " />
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 40],
})

function GeserKePosisi({ lat, lng }) {
  const map = useMap()
  const sudahDicenter = useRef(false)
  useEffect(() => {
    if (!sudahDicenter.current) {
      map.setView([lat, lng])
      sudahDicenter.current = true
    }
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
  const mapRef = useRef(null)

  function handleRecenter() {
    if (lokasi && mapRef.current) {
      mapRef.current.setView([lokasi.lat, lokasi.lng], 16)
    }
  }

  return (
    <div className="peta-embed" style={isiPenuh ? s.wrapPolos : s.wrap}>
      <MapContainer
        ref={mapRef}
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

        <Marker position={LOKASI_OFFICE} icon={ikonOffice} />
      </MapContainer>

      {tampilkanTombolLokasi && (
        <button
          className="btn-map-control"
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

      {lokasi && (
        <button
          className="btn-map-control"
          style={tampilkanTombolLokasi ? s.recenterIconBawah : s.recenterIcon}
          onClick={handleRecenter}
          aria-label="Kembali ke lokasi Fajri"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}

      <div style={s.badge}>
        <span style={lokasi ? s.dotHijau : s.dotMerah} />
        {lokasi ? 'Lokasi Fajri live' : 'Fajri belum share lokasi'}
      </div>
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
    top: 88,
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
    top: 88,
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
  recenterIcon: {
    position: 'absolute',
    top: 88,
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
  recenterIconBawah: {
    position: 'absolute',
    top: 130,
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
  dotHijau: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--signal)', boxShadow: '0 0 5px var(--signal)',
  },
  dotMerah: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--web-red)', boxShadow: '0 0 5px var(--web-red)',
  },
}