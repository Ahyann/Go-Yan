import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { STATUS_PERMINTAAN, LOKASI_OFFICE, LOKASI_UPN } from '../lib/constants'
import { useLokasiOjek } from '../lib/useLokasiOjek'
import { useLokasiPenumpang } from '../lib/useLokasiPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { useProfilIkon } from '../lib/useProfilIkon'
import { useWarnaGlow } from '../lib/useWarnaGlow'
import { ambilWarnaGlow } from '../lib/warnaGlow'
import { useLanguage } from '../context/LanguageContext.jsx'

const PUSAT_DEFAULT = [-6.2088, 106.8456]

const BATAS_PETA = [
  [-11.5, 94.5],
  [6.5, 141.5],
]

function buatIkonOjek(namaFile, warna) {
  return L.divIcon({
    className: '',
    html: `<div style="isolation: isolate;">
      <img src="/icons/${namaFile}" style="
        width:24px;height:24px;
        image-rendering: pixelated;
        filter: drop-shadow(0 0 6px ${warna.utama}) drop-shadow(0 0 12px ${warna.kuat});
      " />
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [42, 8],
  })
}

const ikonSaya = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/fajri.png" style="
      width:16px;height:24px;
      image-rendering: pixelated;
      filter: drop-shadow(0 0 5px #E8EDF9) drop-shadow(0 0 8px #8B96B4);
    " />
  </div>`,
  iconSize: [16, 24],
  iconAnchor: [8, 24],
  popupAnchor: [44, -11],
})

const ikonOffice = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/office.png" style="
      width:20px;height:30px;
      image-rendering: pixelated;
    " />
  </div>`,
  iconSize: [20, 30],
  iconAnchor: [6, 33],
  popupAnchor: [46, -11],
})

const ikonKampus = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/UPN.png" style="
      width:38px;height:38px;
      image-rendering: pixelated;
    " />
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [46, -14],
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

export default function PetaStatus({ permintaan, tampilkanOverlay = true, mapRef: mapRefLuar, onOkeTolak }) {
  const { t } = useLanguage()
  const lokasiOjek = useLokasiOjek()
  const lokasiSaya = useLokasiPenumpang()
  const { pesan, hapusPesan } = usePesanOjek()
  const { pesan: pesanSaya, hapusPesan: hapusPesanSaya } = usePesanPenumpang()
  const { ikonAhyan } = useProfilIkon()
  const { warnaAhyan } = useWarnaGlow()
  const warnaAktif = ambilWarnaGlow(warnaAhyan)
  const ikonOjek = useMemo(() => buatIkonOjek(ikonAhyan, warnaAktif), [ikonAhyan, warnaAktif])
  const posisiValid = lokasiOjek?.lat != null && lokasiOjek?.lng != null
  const posisiSayaValid = lokasiSaya?.lat != null && lokasiSaya?.lng != null
  const adaPosisiOjek = posisiValid && permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  const markerRef = useRef(null)
  const markerSayaRef = useRef(null)
  const markerOfficeRef = useRef(null)
  const markerKampusRef = useRef(null)
  const pesanTampilRef = useRef(null)
  const mapRefInternal = useRef(null)
  const mapRef = mapRefLuar || mapRefInternal
  const [teksBubble, setTeksBubble] = useState(t.bubbleDefault)
  const [pesanTrigger, setPesanTrigger] = useState(null)
  const [markerSiap, setMarkerSiap] = useState(false)
  const [teksBubbleSaya, setTeksBubbleSaya] = useState('')
  const [pesanSayaTrigger, setPesanSayaTrigger] = useState(null)
  const pesanSayaTampilRef = useRef(null)
  const [markerSayaSiap, setMarkerSayaSiap] = useState(false)

  useEffect(() => {
    if (pesan) {
      pesanTampilRef.current = pesan
      setTeksBubble(pesan.teks)
      setPesanTrigger(pesan.dibuatPada)
    }
  }, [pesan])

  useEffect(() => {
    if (pesanTrigger && markerRef.current) {
      const id = setTimeout(() => {
        markerRef.current?.openPopup()
      }, 0)
      return () => clearTimeout(id)
    }
  }, [pesanTrigger, markerSiap])

  useEffect(() => {
    if (pesanSaya) {
      pesanSayaTampilRef.current = pesanSaya
      setTeksBubbleSaya(pesanSaya.teks)
      setPesanSayaTrigger(pesanSaya.dibuatPada)
    } else {
      markerSayaRef.current?.closePopup()
    }
  }, [pesanSaya])

  useEffect(() => {
    if (pesanSayaTrigger && markerSayaRef.current) {
      const id = setTimeout(() => {
        markerSayaRef.current?.openPopup()
      }, 0)
      return () => clearTimeout(id)
    }
  }, [pesanSayaTrigger, markerSayaSiap])

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

        {adaPosisiOjek && (
          <>
            <GeserKePosisi lat={lokasiOjek.lat} lng={lokasiOjek.lng} />
            <Marker
              ref={(instance) => {
                markerRef.current = instance
                if (instance && !markerSiap) setMarkerSiap(true)
              }}
              position={[lokasiOjek.lat, lokasiOjek.lng]}
              icon={ikonOjek}
              zIndexOffset={1000}
              eventHandlers={{
                popupopen: () => {
                  if (!pesanTampilRef.current) {
                    setTeksBubble(t.bubbleDefault)
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
                <div
                  style={s.bubbleWrap}
                  onClick={() => markerRef.current?.closePopup()}
                >
                  <span style={{ ...s.bubbleText, fontSize: ukuranFont }}>{teksBubble}</span>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {posisiSayaValid && (
          <Marker
            ref={(instance) => {
              markerSayaRef.current = instance
              if (instance && !markerSayaSiap) setMarkerSayaSiap(true)
            }}
            position={[lokasiSaya.lat, lokasiSaya.lng]}
            icon={ikonSaya}
            zIndexOffset={500}
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

        <Marker
          ref={markerKampusRef}
          position={LOKASI_UPN}
          icon={ikonKampus}
          zIndexOffset={-100}
          eventHandlers={{
            popupopen: () => {
              setTimeout(() => {
                markerKampusRef.current?.closePopup()
              }, 2500)
            },
          }}
        >
          <Popup closeButton={false} autoClose={false} closeOnClick={false}>
            <div style={s.bubbleWrap}>
              <span style={s.bubbleText}>UPN Veteran Jakarta</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {tampilkanOverlay && (
        <div style={s.overlay}>
          {!permintaan && <div style={s.badgeIdle}>{t.belumAdaPerjalanan}</div>}

          {permintaan?.status === STATUS_PERMINTAAN.MENUNGGU && (
            <div style={s.badgeMenunggu}>
              <IkonLabaLaba />
              <div style={s.menungguText}>
                <span style={s.dotKuning} />{t.menungguAhyanTerima}
              </div>
            </div>
          )}

          {permintaan?.status === STATUS_PERMINTAAN.DITOLAK && (
            <div style={s.badgeTolak}>
              <span>{t.ahyanBelumBisa}</span>
              <button style={s.okeTolakBtn} onClick={onOkeTolak}>{t.selesaiOke}</button>
            </div>
          )}

          {permintaan?.status === STATUS_PERMINTAAN.DITERIMA && (
            <div style={s.badgeLive}>
              <span style={s.dotHijau} />
              {adaPosisiOjek ? t.otwText : t.ahyanUdahTerima}
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
    padding: '10px 14px', borderRadius: 999,
    border: '1px solid var(--web-red)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  okeTolakBtn: {
    flexShrink: 0,
    background: 'var(--web-red)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 14px',
    borderRadius: 999,
  },
  dotKuning: { width: 7, height: 7, borderRadius: '50%', background: 'var(--warn)', display: 'inline-block', marginRight: 6 },
  dotHijau: { width: 7, height: 7, borderRadius: '50%', background: 'var(--signal)', display: 'inline-block', marginRight: 6 },
  badgeLive: {
    background: 'rgba(11,14,26,0.95)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600,
    padding: '10px 14px', borderRadius: 999, textAlign: 'center',
    border: '1px solid var(--signal)',
  },
}