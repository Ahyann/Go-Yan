import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { STATUS_PERMINTAAN, LOKASI_OFFICE } from '../lib/constants'
import { useLokasiOjek } from '../lib/useLokasiOjek'
import { useLokasiPenumpang } from '../lib/useLokasiPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'

const PUSAT_DEFAULT = [-6.2088, 106.8456]

const BATAS_PETA = [
  [-11.5, 94.5],
  [6.5, 141.5],
]

const ikonOjek = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/spidericon.png" style="
      width:32px;height:32px;
      image-rendering: pixelated;
      filter: drop-shadow(0 0 6px #5ED0FF) drop-shadow(0 0 12px #2B9EE8);
    " />
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [42, 0],
})

const ikonSaya = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/fajri.png" style="
      width:18px;height:27px;
      image-rendering: pixelated;
      filter: drop-shadow(0 0 5px #E8EDF9) drop-shadow(0 0 8px #8B96B4);
    " />
  </div>`,
  iconSize: [18, 27],
  iconAnchor: [9, 27],
  popupAnchor: [30, -4],
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

export default function PetaStatus({ permintaan, tampilkanOverlay = true, mapRef: mapRefLuar }) {
  const lokasiOjek = useLokasiOjek()
  const lokasiSaya = useLokasiPenumpang()
  const { pesan, hapusPesan } = usePesanOjek()
  const { pesan: pesanSaya } = usePesanPenumpang()
  const adaLokasiLive = lokasiOjek && permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  const markerRef = useRef(null)
  const markerSayaRef = useRef(null)
  const pesanTampilRef = useRef(null)
  const mapRefInternal = useRef(null)
  const mapRef = mapRefLuar || mapRefInternal
  const [teksBubble, setTeksBubble] = useState('Otw dutzz!')

  useEffect(() => {
    if (pesan && markerRef.current) {
      pesanTampilRef.current = pesan
      setTeksBubble(pesan.teks)
      markerRef.current.openPopup()
    }
  }, [pesan, adaLokasiLive])

  useEffect(() => {
    if (!markerSayaRef.current) return
    if (pesanSaya) {
      markerSayaRef.current.openPopup()
    } else {
      markerSayaRef.current.closePopup()
    }
  }, [pesanSaya])

  const ukuranFont = teksBubble.length > 16 ? 7 : 9

  return (
    <div style={s.wrap}>
      <MapContainer
        ref={mapRef}
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
            <Marker
              ref={markerRef}
              position={[lokasiOjek.lat, lokasiOjek.lng]}
              icon={ikonOjek}
              zIndexOffset={1000}
              eventHandlers={{
                popupopen: () => {
                  if (!pesanTampilRef.current) {
                    setTeksBubble('Otw dutzz!')
                    setTimeout(() => {
                      markerRef.current?.closePopup()
                    }, 2000)
                  }
                },
                popupclose: () => {
                  if (pesanTampilRef.current) {
                    hapusPesan()
                    pesanTampilRef.current = null
                  }
                },
              }}
            >
              <Popup closeButton={false} autoClose={false} closeOnClick={false}>
                <div style={s.bubbleWrap}>
                  <span style={{ ...s.bubbleText, fontSize: ukuranFont }}>{teksBubble}</span>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {lokasiSaya && (
          <Marker ref={markerSayaRef} position={[lokasiSaya.lat, lokasiSaya.lng]} icon={ikonSaya} zIndexOffset={500}>
            {pesanSaya && (
              <Popup closeButton={false} autoClose={false} closeOnClick={false}>
                <div style={s.bubbleWrap}>
                  <span style={{ ...s.bubbleText, fontSize: pesanSaya.teks.length > 16 ? 7 : 9 }}>
                    {pesanSaya.teks}
                  </span>
                </div>
              </Popup>
            )}
          </Marker>
        )}

        <Marker position={LOKASI_OFFICE} icon={ikonOffice} />
      </MapContainer>

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
              {adaLokasiLive ? 'OTWWW!!' : 'Ahyan udah terima, tunggu ya! ✓'}
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
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 'calc(var(--safe-bottom) + 100px)',
    zIndex: 1000,
  },
  bubbleWrap: {
    backgroundImage: 'url(/icons/bubbletext.png)',
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    width: 102,
    height: 51,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 14,
    paddingLeft: 6,
    paddingRight: 6,
  },
  bubbleText: {
    fontFamily: 'var(--font-pixel)',
    fontSize: 9,
    color: '#0B0E1A',
    textAlign: 'center',
    lineHeight: 1.2,
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