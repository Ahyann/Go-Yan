import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import QuickChatMarker from './QuickChatMarker.jsx'
import { useLokasiOjek } from '../lib/useLokasiOjek'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import { useProfilIkon } from '../lib/useProfilIkon'
import { useWarnaGlow } from '../lib/useWarnaGlow'
import { ambilWarnaGlow } from '../lib/warnaGlow'
import { ambilPetaTerakhir, simpanPetaTerakhir } from '../lib/petaTerakhir'
import BubblePesan, { geserPopupCermin, geserPopupFoto } from './BubblePesan.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { LOKASI_OFFICE, LOKASI_UPN } from '../lib/constants'

const PUSAT_DEFAULT = [-6.2088, 106.8456]
// Ukuran dan jarak tombol kontrol, hampir sama dengan peta di akun Fajri tapi sedikit lebih kecil.
const JARAK_TOMBOL = 10
const JARAK_DARI_ZOOM = 8
const UKURAN_TOMBOL = 32
const KEY_PETA_TERAKHIR = 'go-yan-peta-terakhir-ojek'

const BATAS_PETA = [
  [-11.5, 94.5],
  [6.5, 141.5],
]

function buatIkonPenumpang(namaFile, warna) {
  return L.divIcon({
    className: '',
    html: `<div style="isolation: isolate;">
      <img src="/icons/${namaFile}" style="
        width:16px;height:24px;
        image-rendering: pixelated;
        pointer-events:none;-webkit-user-drag:none;-webkit-touch-callout:none;user-select:none;
        filter: drop-shadow(0 0 6px ${warna.utama}) drop-shadow(0 0 10px ${warna.kuat});
      " />
    </div>`,
    iconSize: [16, 24],
    iconAnchor: [8, 24],
    popupAnchor: [37, -4],
  })
}

function buatIkonSaya(namaFile, warna) {
  return L.divIcon({
    className: '',
    html: `<div style="isolation: isolate;">
      <img src="/icons/${namaFile}" style="
        width:24px;height:24px;
        image-rendering: pixelated;
        pointer-events:none;-webkit-user-drag:none;-webkit-touch-callout:none;user-select:none;
        filter: drop-shadow(0 0 6px ${warna.utama}) drop-shadow(0 0 10px ${warna.kuat});
      " />
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [42, 15],
  })
}

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

// Kartu di bawah peta muncul/hilang bikin tinggi peta berubah, tapi Leaflet
// gak sadar sendiri, jadi "tengah" peta jadi meleset. Pantau ukurannya.
function PantauUkuran() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const ro = new ResizeObserver(() => map.invalidateSize({ animate: false }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [map])
  return null
}

function SimpanPosisiPeta() {
  useMapEvents({
    moveend: (e) => {
      const map = e.target
      simpanPetaTerakhir(KEY_PETA_TERAKHIR, map.getCenter(), map.getZoom())
    },
  })
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
  const { isDemo } = useAuth()
  const teksKosongFinal = teksKosong ?? (isDemo ? t.passengerBelumShare : t.fajriBelumShare)
  const posisiValid = lokasi?.lat != null && lokasi?.lng != null
  const lokasiSaya = useLokasiOjek()
  const posisiSayaValid = lokasiSaya?.lat != null && lokasiSaya?.lng != null
  const { pesan, hapusPesan } = usePesanPenumpang()
  const { pesan: pesanSaya, hapusPesan: hapusPesanSaya, kirimPesan: kirimPesanSaya } = usePesanOjek()
  const { ikonAhyan, ikonFajri } = useProfilIkon()
  const { warnaAhyan, warnaFajri } = useWarnaGlow()
  const warnaAktif = ambilWarnaGlow(warnaAhyan)
  const warnaAktifFajri = ambilWarnaGlow(warnaFajri)
  const ikonSaya = useMemo(() => buatIkonSaya(ikonAhyan, warnaAktif), [ikonAhyan, warnaAktif])
  const ikonPenumpang = useMemo(() => buatIkonPenumpang(ikonFajri, warnaAktifFajri), [ikonFajri, warnaAktifFajri])
  const posisiAwal = useMemo(() => ambilPetaTerakhir(KEY_PETA_TERAKHIR, PUSAT_DEFAULT, 13), [])
  const pusat = posisiValid ? [lokasi.lat, lokasi.lng] : posisiAwal.center
  const tampilkanTombolLokasi = typeof onToggleLokasi === 'function'
  const mapRef = useRef(null)
  const wrapRef = useRef(null)
  const [posisiBar, setPosisiBar] = useState(null)
  const markerRef = useRef(null)
  const markerSayaRef = useRef(null)
  const markerOfficeRef = useRef(null)
  const markerKampusRef = useRef(null)
  const pesanTampilRef = useRef(null)
  const [teksBubble, setTeksBubble] = useState('')
  const [pesanTrigger, setPesanTrigger] = useState(null)
  const [markerSiap, setMarkerSiap] = useState(false)
  const [teksBubbleSaya, setTeksBubbleSaya] = useState('')
  const [pesanSayaTrigger, setPesanSayaTrigger] = useState(null)
  const pesanSayaTampilRef = useRef(null)
  const [markerSayaSiap, setMarkerSayaSiap] = useState(false)

  // Tombol kontrol tambahan ditaruh di bawah tombol +/- dengan jarak seperti di akun Fajri,
  // posisinya diukur dari kontrol zoom Leaflet supaya selalu sejajar.
  useEffect(() => {
    function ukur() {
      const wrap = wrapRef.current
      const zoom = wrap?.querySelector('.leaflet-control-zoom')
      if (!wrap || !zoom) return
      const w = wrap.getBoundingClientRect()
      const z = zoom.getBoundingClientRect()
      setPosisiBar({ top: z.bottom - w.top + JARAK_DARI_ZOOM, right: w.right - z.right })
    }
    const id = requestAnimationFrame(ukur)
    window.addEventListener('resize', ukur)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', ukur)
    }
  }, [])

  useEffect(() => {
    if (pesan) {
      pesanTampilRef.current = pesan
      setTeksBubble(pesan.teks)
      setPesanTrigger(pesan.dibuatPada)
    } else {
      // Ref direset dulu supaya closePopup() di bawah gak ikut manggil
      // hapusPesan() lagi lewat handler popupclose.
      pesanTampilRef.current = null
      setTeksBubble('')
      setPesanTrigger(null)
      markerRef.current?.closePopup()
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
      pesanSayaTampilRef.current = null
      setTeksBubbleSaya('')
      setPesanSayaTrigger(null)
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

  const fotoBubble = pesan?.foto ?? ''
  const fotoBubbleSaya = pesanSaya?.foto ?? ''

  function handleRecenter() {
    if (posisiValid && mapRef.current) {
      mapRef.current.invalidateSize({ animate: false })
      mapRef.current.setView([lokasi.lat, lokasi.lng], 16)
    }
  }

  function handleRecenterSaya() {
    if (posisiSayaValid && mapRef.current) {
      mapRef.current.invalidateSize({ animate: false })
      mapRef.current.setView([lokasiSaya.lat, lokasiSaya.lng], 16)
    }
  }

  return (
    <div ref={wrapRef} className="peta-embed" style={isiPenuh ? s.wrapPolos : s.wrap}>
      <MapContainer
        ref={mapRef}
        center={pusat}
        zoom={lokasi ? 16 : posisiAwal.zoom}
        minZoom={5}
        maxBounds={BATAS_PETA}
        maxBoundsViscosity={1.0}
        style={s.map}
        zoomControl={false}
        attributionControl={false}
        dragging={true}
        scrollWheelZoom={true}
      >
        <SimpanPosisiPeta />
        <PantauUkuran />
        <ZoomControl position="topright" />

        <TileLayer
          url={`https://api.maptiler.com/maps/streets-v4-dark/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
        />

        {posisiValid && (
          <>
            <GeserKePosisi lat={lokasi.lat} lng={lokasi.lng} />
            <Marker
              ref={(instance) => {
                markerRef.current = instance
                if (instance && !markerSiap) setMarkerSiap(true)
              }}
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
              {(teksBubble || fotoBubble) && (
<Popup
  key={fotoBubble ? 'foto' : 'teks'}
  closeButton={false}
  autoClose={false}
  closeOnClick={false}
  offset={fotoBubble ? geserPopupCermin(37) : [0, 0]}
>
<BubblePesan teks={teksBubble} foto={fotoBubble} cermin onTutup={() => markerRef.current?.closePopup()} />
</Popup>
)}
            </Marker>
          </>
        )}

        {posisiSayaValid && (
          <>
            <GeserKePosisi lat={lokasiSaya.lat} lng={lokasiSaya.lng} />
            <Marker
              ref={(instance) => {
                markerSayaRef.current = instance
                if (instance && !markerSayaSiap) setMarkerSayaSiap(true)
              }}
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
              {(teksBubbleSaya || fotoBubbleSaya) && (
<Popup
  key={fotoBubbleSaya ? 'foto' : 'teks'}
  closeButton={false}
  autoClose={false}
  closeOnClick={false}
  offset={fotoBubbleSaya ? geserPopupFoto : [0, 0]}
>
<BubblePesan teks={teksBubbleSaya} foto={fotoBubbleSaya} onTutup={() => markerSayaRef.current?.closePopup()} />
</Popup>
)}
            </Marker>
            <QuickChatMarker
              marker={markerSayaRef.current}
              siap={markerSayaSiap}
              ikon={ikonSaya}
              aktif
              onKirim={kirimPesanSaya}
              pesanCepat={t.quickChatPesan}
            />
          </>
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
              <span style={s.bubbleText}>{isDemo ? t.passengerOffice : t.fajriOffice}</span>
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

      {(tampilkanTombolLokasi || posisiValid || posisiSayaValid) && (
        <div
          className="peta-bar-tambahan"
          style={{
            ...s.barTambahan,
            ...(posisiBar ?? { visibility: 'hidden' }),
          }}
        >
          {tampilkanTombolLokasi && (
            <button
              className="btn-map-control"
              style={lokasiAktif ? s.lokasiIconAktif : s.kotakKontrol}
              onClick={onToggleLokasi}
              aria-label={lokasiAktif ? t.ariaMatikanLive : t.ariaNyalakanLive}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </button>
          )}
          {posisiValid && (
            <button
              className="btn-map-control"
              style={s.kotakKontrol}
              onClick={handleRecenter}
              aria-label={isDemo ? t.ariaKembaliLokasiPassenger : t.ariaKembaliLokasiFajri}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </button>
          )}
          {posisiSayaValid && (
            <button
              className="btn-map-control"
              style={s.kotakKontrol}
              onClick={handleRecenterSaya}
              aria-label={t.ariaKembaliKarakterSaya}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div style={s.badge}>
        <span style={posisiValid ? s.dotHijau : s.dotMerah} />
        {posisiValid ? (isDemo ? t.lokasiPassengerLive : t.lokasiFajriLive) : teksKosongFinal}
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
  barTambahan: {
    position: 'absolute',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: JARAK_TOMBOL,
  },
  kotakKontrol: {
    width: UKURAN_TOMBOL,
    height: UKURAN_TOMBOL,
    borderRadius: 8,
    background: '#fff',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
  },
  lokasiIconAktif: {
    width: UKURAN_TOMBOL,
    height: UKURAN_TOMBOL,
    borderRadius: 8,
    background: '#B8242F',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 10px #B8242F, 0 1px 5px rgba(0,0,0,0.4)',
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