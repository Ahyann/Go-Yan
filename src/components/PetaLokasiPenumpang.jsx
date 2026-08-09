import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLokasiOjek } from '../lib/useLokasiOjek'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import { useLanguage } from '../context/LanguageContext.jsx'
import { LOKASI_OFFICE } from '../lib/constants'

const PUSAT_DEFAULT = [-6.2088, 106.8456]

// Ukuran Fajri disamain "bobot visual"-nya sama Ojek (spiderman) di
// peta yang sama — proporsi asli gambarnya 60:92 (lebih tinggi dari
// lebar), jadi lebar dihitung ngikutin tinggi biar gak gepeng.
const ikonPenumpang = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/fajri.png" style="
      width:21px;height:32px;
      image-rendering: pixelated;
      filter: drop-shadow(0 0 6px #E8EDF9) drop-shadow(0 0 10px #8B96B4);
    " />
  </div>`,
  iconSize: [21, 32],
  iconAnchor: [11, 32],
  popupAnchor: [49, -14],
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
  popupAnchor: [34, 0],
})

// Proporsi asli gambar office ternyata gedung TINGGI (rasio ~0.667,
// bukan hampir kotak) — file lama yang salah, ini yang bener.
const ikonOffice = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/office.png" style="
      width:27px;height:40px;
      image-rendering: pixelated;
    " />
  </div>`,
  iconSize: [27, 40],
  iconAnchor: [13, 38],
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
  teksKosong,
  isiPenuh = false,
  lokasiAktif,
  onToggleLokasi,
}) {
  const { t } = useLanguage()
  const teksKosongFinal = teksKosong ?? t.fajriBelumShare
  const lokasiSaya = useLokasiOjek()
  const { pesan, hapusPesan } = usePesanPenumpang()
  const { pesan: pesanSaya, hapusPesan: hapusPesanSaya } = usePesanOjek()
  const pusat = lokasi ? [lokasi.lat, lokasi.lng] : PUSAT_DEFAULT
  const tampilkanTombolLokasi = typeof onToggleLokasi === 'function'
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const markerSayaRef = useRef(null)
  const markerOfficeRef = useRef(null)
  const pesanTampilRef = useRef(null)
  const [teksBubble, setTeksBubble] = useState('')
  const [teksBubbleSaya, setTeksBubbleSaya] = useState('')
  const pesanSayaTampilRef = useRef(null)

  useEffect(() => {
    if (pesan && markerRef.current) {
      pesanTampilRef.current = pesan
      setTeksBubble(pesan.teks)
      markerRef.current.openPopup()
    }
  }, [pesan, lokasi])

  useEffect(() => {
    if (!markerSayaRef.current) return
    if (pesanSaya) {
      pesanSayaTampilRef.current = pesanSaya
      setTeksBubbleSaya(pesanSaya.teks)
      markerSayaRef.current.openPopup()
    } else {
      // Data-nya udah kehapus (mungkin dari sisi Ahyan) — tutup pake
      // closePopup() (Leaflet main animasi fade-nya), BUKAN langsung
      // ilangin dari layar. teksBubbleSaya sengaja gak dikosongin di
      // sini, biar teksnya masih "nempel" pas lagi fade out.
      markerSayaRef.current.closePopup()
    }
  }, [pesanSaya])

  const ukuranFont = teksBubble.length > 16 ? 7 : 9

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
            <Marker
              ref={markerRef}
              position={[lokasi.lat, lokasi.lng]}
              icon={ikonPenumpang}
              zIndexOffset={500}
              eventHandlers={{
                popupopen: () => {
                  if (!pesanTampilRef.current) {
                    setTimeout(() => {
                      markerRef.current?.closePopup()
                    }, 1500)
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
              {teksBubble && (
                <Popup closeButton={false} autoClose={false} closeOnClick={false}>
                  <div
                    style={s.bubbleWrap}
                    onClick={() => markerRef.current?.closePopup()}
                  >
                    <span style={{ ...s.bubbleText, fontSize: ukuranFont }}>{teksBubble}</span>
                  </div>
                </Popup>
              )}
            </Marker>
          </>
        )}

        {lokasiSaya && (
          <Marker
            ref={markerSayaRef}
            position={[lokasiSaya.lat, lokasiSaya.lng]}
            icon={ikonSaya}
            zIndexOffset={1000}
            eventHandlers={{
              popupclose: () => {
                if (pesanSayaTampilRef.current) {
                  hapusPesanSaya()
                  pesanSayaTampilRef.current = null
                }
              },
            }}
          >
            {teksBubbleSaya && (
              <Popup closeButton={false} autoClose={false} closeOnClick={false}>
                <div
                  style={s.bubbleWrap}
                  onClick={() => markerSayaRef.current?.closePopup()}
                >
                  <span style={{ ...s.bubbleText, fontSize: teksBubbleSaya.length > 16 ? 7 : 9 }}>
                    {teksBubbleSaya}
                  </span>
                </div>
              </Popup>
            )}
          </Marker>
        )}

        <Marker
          ref={markerOfficeRef}
          position={LOKASI_OFFICE}
          icon={ikonOffice}
          zIndexOffset={-100}
          eventHandlers={{
            popupopen: () => {
              setTimeout(() => {
                markerOfficeRef.current?.closePopup()
              }, 2500)
            },
          }}
        >
          <Popup closeButton={false} autoClose={false} closeOnClick={false}>
            <div style={s.bubbleWrap}>
              <span style={s.bubbleText}>{t.yourOffice}</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {tampilkanTombolLokasi && (
        <button
          className="btn-map-control"
          style={lokasiAktif ? s.lokasiIconAktif : s.lokasiIcon}
          onClick={onToggleLokasi}
          aria-label={lokasiAktif ? t.ariaMatikanLive : t.ariaNyalakanLive}
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
          aria-label={t.ariaKembaliLokasiFajri}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}

      <div style={s.badge}>
        <span style={lokasi ? s.dotHijau : s.dotMerah} />
        {lokasi ? t.lokasiFajriLive : teksKosongFinal}
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
