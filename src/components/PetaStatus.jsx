import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { STATUS_PERMINTAAN, AKSI, LOKASI_OFFICE, LOKASI_UPN } from '../lib/constants'
import { useLokasiOjek } from '../lib/useLokasiOjek'
import { useLokasiPenumpang } from '../lib/useLokasiPenumpang'
import { usePesanOjek } from '../lib/usePesanOjek'
import { usePesanPenumpang } from '../lib/usePesanPenumpang'
import { useRiwayatChat } from '../lib/useRiwayatChat'
import QuickChatMarker from './QuickChatMarker.jsx'
import PemutarSuara from './PemutarSuara.jsx'
import { playPesananBatal } from '../lib/sound'
import SpideyMenunggu from './SpideyMenunggu.jsx'
import PusatkanKeSaya from './PusatkanKeSaya.jsx'
import { useBubblePesan } from '../lib/useBubblePesan'
import { useProfilIkon } from '../lib/useProfilIkon'
import { useWarnaGlow } from '../lib/useWarnaGlow'
import { ambilWarnaGlow } from '../lib/warnaGlow'
import { ambilPetaTerakhir, simpanPetaTerakhir } from '../lib/petaTerakhir'
import BubblePesan, { geserPopupCermin, geserPopupFoto, geserPopupTeksCermin } from './BubblePesan.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const PUSAT_DEFAULT = [-6.2088, 106.8456]
const KEY_PETA_TERAKHIR = 'go-yan-peta-terakhir-penumpang'

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
        pointer-events:none;-webkit-user-drag:none;-webkit-touch-callout:none;user-select:none;
        filter: drop-shadow(0 0 6px ${warna.utama}) drop-shadow(0 0 12px ${warna.kuat});
      " />
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [42, 6],
  })
}

function buatIkonSaya(namaFile, warna) {
  return L.divIcon({
    className: '',
    html: `<div style="isolation: isolate;">
      <img src="/icons/${namaFile}" style="
        width:16px;height:24px;
        image-rendering: pixelated;
        pointer-events:none;-webkit-user-drag:none;-webkit-touch-callout:none;user-select:none;
        filter: drop-shadow(0 0 5px ${warna.utama}) drop-shadow(0 0 8px ${warna.kuat});
      " />
    </div>`,
    iconSize: [16, 24],
    iconAnchor: [8, 24],
    popupAnchor: [44, -11],
  })
}

const ikonOffice = L.divIcon({
  className: '',
  html: `<div style="isolation: isolate;">
    <img src="/icons/office.png" style="
      width:20px;height:30px;
      image-rendering: pixelated;
        pointer-events:none;-webkit-user-drag:none;-webkit-touch-callout:none;user-select:none;
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
        pointer-events:none;-webkit-user-drag:none;-webkit-touch-callout:none;user-select:none;
    " />
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [46, -14],
})

function SimpanPosisiPeta() {
  useMapEvents({
    moveend: (e) => {
      const map = e.target
      simpanPetaTerakhir(KEY_PETA_TERAKHIR, map.getCenter(), map.getZoom())
    },
  })
  return null
}

// Nandain kalau user udah geser/zoom peta sendiri. Disimpan di objek peta
// (bukan di komponen) supaya tetap kebaca walau GeserKePosisi dipasang ulang.
function TandaiGeserUser() {
  const map = useMap()
  useMapEvents({
    dragstart: () => { map.userSudahGeser = true },
    zoomstart: () => { map.userSudahGeser = true },
  })
  return null
}

// Pusatin peta ke posisi sekali di awal, tapi jangan pernah narik balik peta
// yang udah digeser atau di-zoom user.
function GeserKePosisi({ lat, lng }) {
  const map = useMap()
  const sudahDicenter = useRef(false)
  useEffect(() => {
    if (!sudahDicenter.current) {
      if (!map.userSudahGeser) map.setView([lat, lng])
      sudahDicenter.current = true
    }
  }, [lat, lng, map])
  return null
}

// Kalau karakter keluar dari layar karena peta digeser, muncul tab di tepi peta yang menunjuk
// ke arahnya dan menampilkan jaraknya dari titik tengah layar. Ditekan, peta terbang balik.
const MARGIN_PENUNJUK = { kiri: 0, kanan: 0, atas: 112 }
const LEBAR_TAB = 56
const TINGGI_TAB = 42

function formatJarak(meter) {
  if (meter < 1000) return `${Math.max(10, Math.round(meter / 10) * 10)} M`
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(meter / 1000)} KM`
}

// bawah: tinggi area di dasar peta yang tertutup kartu status dan dock (px). Karakter yang
// tersembunyi di balik kartu juga dianggap di luar layar.
export function PenunjukKarakter({ posisi, ikon, label, bawah }) {
  const map = useMap()
  const [info, setInfo] = useState(null)
  const refTombol = useRef(null)

  const hitung = () => {
    if (!posisi) { setInfo(null); return }
    const ukuran = map.getSize()
    const p = map.latLngToContainerPoint(posisi)
    if (p.x >= 0 && p.x <= ukuran.x && p.y >= 0 && p.y <= ukuran.y - bawah) { setInfo(null); return }
    const dx = p.x - ukuran.x / 2
    const dy = p.y - ukuran.y / 2
    const m = { ...MARGIN_PENUNJUK, bawah }
    // Tepi yang dituju: kiri/kanan kalau karakter lebih jauh ke samping, atas/bawah kalau lebih jauh ke atas/bawah.
    const sisi = Math.abs(dx) / ukuran.x > Math.abs(dy) / (ukuran.y - m.atas - m.bawah) ? (dx < 0 ? 'kiri' : 'kanan') : (dy < 0 ? 'atas' : 'bawah')
    const jepit = (v, min, max) => Math.round(Math.max(min, Math.min(max, v)))
    const y = jepit(p.y, m.atas + TINGGI_TAB / 2, ukuran.y - m.bawah - TINGGI_TAB / 2)
    const x = jepit(p.x, LEBAR_TAB / 2, ukuran.x - LEBAR_TAB / 2)
    const baru = {
      sisi,
      x,
      y,
      sudut: Math.round((Math.atan2(dy, dx) * 180) / Math.PI),
      jarak: formatJarak(map.distance(map.getCenter(), posisi)),
      lebar: ukuran.x,
      tinggi: ukuran.y,
    }
    setInfo((lama) => (lama && Object.keys(baru).every((k) => lama[k] === baru[k]) ? lama : baru))
  }

  useMapEvents({ move: hitung, zoom: hitung, resize: hitung })
  useEffect(hitung, [posisi, bawah]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (refTombol.current) L.DomEvent.disableClickPropagation(refTombol.current)
  }, [info !== null])

  if (!info) return null
  const { sisi } = info
  const kiriKanan = sisi === 'kiri' || sisi === 'kanan'
  const gaya = { position: 'absolute', zIndex: 900, transition: 'bottom 0.2s ease-out' }
  if (sisi === 'kiri') Object.assign(gaya, { left: 0, top: info.y, transform: 'translateY(-50%)' })
  else if (sisi === 'kanan') Object.assign(gaya, { right: 0, top: info.y, transform: 'translateY(-50%)' })
  else if (sisi === 'atas') Object.assign(gaya, { left: info.x, top: MARGIN_PENUNJUK.atas, transform: 'translateX(-50%)' })
  else Object.assign(gaya, { left: info.x, bottom: bawah + 6, transform: 'translateX(-50%)' })

  const blokPanah = (
    <span style={{ width: 18, alignSelf: 'stretch', flexShrink: 0, background: 'var(--nav-red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" aria-hidden="true" style={{ transform: `rotate(${info.sudut}deg)` }}>
        <path d="M9 5l7 7-7 7" />
      </svg>
    </span>
  )
  const isi = (
    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0 3px' }}>
      <img src={`/icons/${ikon.file}`} alt="" style={{ width: 'auto', height: Math.min(ikon.h, 18), imageRendering: 'pixelated', pointerEvents: 'none', flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, lineHeight: 1, color: 'var(--glow-blue)', whiteSpace: 'nowrap' }}>{info.jarak}</span>
    </span>
  )

  return (
    <div ref={refTombol} style={gaya}>
      <button
        type="button"
        className="tekan kotak-pop"
        aria-label={`${label}, ${info.jarak}`}
        onClick={() => map.flyTo(posisi, map.getZoom(), { duration: 0.6 })}
        style={{
          width: LEBAR_TAB,
          height: TINGGI_TAB,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sisi === 'kanan' ? 'flex-end' : 'flex-start',
          background: 'var(--panel)',
          border: '1px solid var(--glow-blue)',
          borderLeft: sisi === 'kiri' ? 'none' : '1px solid var(--glow-blue)',
          borderRight: sisi === 'kanan' ? 'none' : '1px solid var(--glow-blue)',
          padding: 0,
        }}
      >
        {sisi === 'kanan' ? <>{isi}{blokPanah}</> : <>{blokPanah}{isi}</>}
      </button>
    </div>
  )
}

// ulangMs: kalau diisi, teks yang sudah selesai diketik diam sekian milidetik, dihapus huruf demi
// huruf dari belakang, lalu diketik ulang (lebih pelan dari ketikan biasa).
function TeksMengetik({ teks, ulangMs = 0 }) {
  const [jumlahHuruf, setJumlahHuruf] = useState(0)

  useEffect(() => {
    let n = 0
    let fase = 'ketik'
    let timer
    const ketikMs = ulangMs > 0 ? 110 : 45
    const langkah = () => {
      let tunggu = ketikMs
      if (fase === 'ketik') {
        if (n < teks.length) n += 1
        if (n >= teks.length) {
          if (ulangMs <= 0) { setJumlahHuruf(n); return }
          fase = 'hapus'
          tunggu = ulangMs
        }
      } else {
        n -= 1
        tunggu = 45
        if (n <= 0) { n = 0; fase = 'ketik'; tunggu = 500 }
      }
      setJumlahHuruf(n)
      timer = setTimeout(langkah, tunggu)
    }
    setJumlahHuruf(0)
    timer = setTimeout(langkah, ketikMs)
    return () => clearTimeout(timer)
  }, [teks, ulangMs])

  return (
    <>
      {teks.slice(0, jumlahHuruf)}
      {jumlahHuruf < teks.length && <span className="typing-cursor">|</span>}
    </>
  )
}

// Jam pesan dalam format 24 jam, misalnya 13:05.
function formatJam(ms) {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Tempat ikon chat: tahan ikonnya lalu geser untuk memindahkan ke salah satu dari tiga pojok.
// Kotak chat keluar dari pojok itu ke arah dalam layar (kiri atas dari kanan bawah, kanan atas dari kiri bawah).
const SLOT_CHAT = ['kanan-atas', 'kanan-bawah', 'kiri-bawah']
const KUNCI_SLOT_CHAT = 'goyan:slot-chat'
const ASAL_TRANSFORM = { 'kanan-atas': 'top right', 'kanan-bawah': 'bottom right', 'kiri-bawah': 'bottom left' }

function bacaSlotChat() {
  try {
    const nilai = localStorage.getItem(KUNCI_SLOT_CHAT)
    return SLOT_CHAT.includes(nilai) ? nilai : 'kanan-atas'
  } catch {
    return 'kanan-atas'
  }
}

// bawah: tinggi dasar peta yang tertutup kartu status dan dock, supaya pojok bawah ikut naik-turun bersama kartu.
function gayaSlot(slot, bawah) {
  const atas = slot === 'kanan-atas'
  const kiri = slot === 'kiri-bawah'
  return {
    top: atas ? 'calc(var(--safe-top) + 14px)' : 'auto',
    bottom: atas ? 'auto' : bawah + 8,
    left: kiri ? 14 : 'auto',
    right: kiri ? 'auto' : 14,
    transition: 'bottom 0.2s ease-out',
  }
}

const KUNCI_ANIM_DITONTON = 'goyan:anim-diterima'

function bacaAnimDitonton() {
  try {
    return localStorage.getItem(KUNCI_ANIM_DITONTON)
  } catch {
    return null
  }
}

function simpanAnimDitonton(dibuatPada) {
  try {
    if (dibuatPada) localStorage.setItem(KUNCI_ANIM_DITONTON, String(dibuatPada))
  } catch {
    // tanpa penyimpanan, animasi bisa main lagi di kunjungan berikutnya, tidak fatal
  }
}

export default function PetaStatus({ permintaan, tampilkanOverlay = true, mapRef: mapRefLuar, baruDibatalkan = false, sinyalLive = 0, isiKartu = null }) {
  const { t } = useLanguage()
  const [kartuBuka, setKartuBuka] = useState(true)
  // Saat pesanan baru diterima, kartu Spiderman tetap tampil sebentar untuk animasi "diterima"
  // (centang, tulisan berganti, Spiderman tertarik ke atas) sebelum kartu status perjalanan muncul.
  const [transisiDiterima, setTransisiDiterima] = useState(false)
  // Sama untuk pembatalan: pesanan yang sedang menunggu hilang (dibatalkan), kartu tetap tampil
  // sebentar dengan animasi Spiderman sedih lalu menghilang.
  const [transisiBatal, setTransisiBatal] = useState(false)
  // Setelah animasinya selesai, kartu menyusut dulu sampai setinggi lencana teks sebelum diganti olehnya.
  const [susutBatal, setSusutBatal] = useState(false)
  // Pembatalan karena driver menolak memakai gaya "ditolak" (mengangkat bahu + silang), bukan sedih.
  const [transisiTolak, setTransisiTolak] = useState(false)
  // Perubahan status dideteksi saat render (bukan di effect). Dengan begitu tidak ada satu render pun
  // di mana kartu Spiderman sempat lepas lalu dipasang ulang (yang membuatnya berkedip dan memutar
  // animasi masuk lagi); kartu yang sama langsung berlanjut ke animasi "diterima" atau "dibatalkan".
  const [statusLalu, setStatusLalu] = useState(permintaan?.status)
  const dibuatPadaRef = useRef(permintaan?.dibuatPada)
  if (permintaan?.dibuatPada) dibuatPadaRef.current = permintaan.dibuatPada
  // Kalau driver menerima saat penumpang sedang pergi (ganti tab, app ditutup, layar mati), animasi "diterima"
  // belum sempat dilihat. Ingatan di perangkat menyimpan pesanan mana yang animasinya sudah diputar, jadi
  // begitu Home dibuka lagi animasinya tetap main dulu sebelum masuk ke sesi antar-jemput.
  const [terlihat, setTerlihat] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible')
  useEffect(() => {
    const ubah = () => setTerlihat(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', ubah)
    return () => document.removeEventListener('visibilitychange', ubah)
  }, [])
  const belumDitonton =
    permintaan?.status === STATUS_PERMINTAAN.DITERIMA && terlihat && bacaAnimDitonton() !== String(permintaan.dibuatPada)
  const animDiterima = transisiDiterima || belumDitonton
  if (statusLalu !== permintaan?.status) {
    setStatusLalu(permintaan?.status)
    if (statusLalu === STATUS_PERMINTAAN.MENUNGGU && permintaan?.status === STATUS_PERMINTAAN.DITERIMA && terlihat) setTransisiDiterima(true)
    if (statusLalu === STATUS_PERMINTAAN.MENUNGGU && (!permintaan?.status || permintaan?.status === STATUS_PERMINTAAN.DITOLAK)) {
      setTransisiBatal(true)
      setTransisiTolak(permintaan?.status === STATUS_PERMINTAAN.DITOLAK)
      setSusutBatal(false)
    }
  }
  useEffect(() => {
    if (belumDitonton) setTransisiDiterima(true)
  }, [belumDitonton])
  useEffect(() => {
    if (!transisiDiterima) return undefined
    simpanAnimDitonton(dibuatPadaRef.current)
    const id = setTimeout(() => setTransisiDiterima(false), 2500)
    return () => clearTimeout(id)
  }, [transisiDiterima])
  useEffect(() => {
    if (!transisiBatal) return undefined
    playPesananBatal()
    const mulaiSusut = setTimeout(() => setSusutBatal(true), 2600)
    const selesai = setTimeout(() => {
      setTransisiBatal(false)
      setSusutBatal(false)
      setTransisiTolak(false)
    }, 3200)
    return () => {
      clearTimeout(mulaiSusut)
      clearTimeout(selesai)
    }
  }, [transisiBatal])
  const [chatBuka, setChatBuka] = useState(true)
  // Kotak chat yang masih kosong tidak membuka sendiri; baru tampil kalau tombolnya diketuk.
  const [kosongDibuka, setKosongDibuka] = useState(false)
  const [chatDilihat, setChatDilihat] = useState(0)
  const [slotChat, setSlotChat] = useState(bacaSlotChat)
  const [seret, setSeret] = useState(null)
  const wrapRef = useRef(null)
  const slotRefs = useRef({})
  const tahanRef = useRef(null)
  const awalTahanRef = useRef(null)
  const sedangSeretRef = useRef(false)
  const sorotRef = useRef('kanan-atas')
  const baruSeretRef = useRef(false)
  const posSeretRef = useRef({ x: 0, y: 0 })
  const gelembungRef = useRef(null)
  const [mendarat, setMendarat] = useState(null)
  // Foto di chat diperbesar: gambar tumbuh dari posisi miniaturnya ke tengah layar, dan balik lagi saat ditutup.
  const [fotoBesar, setFotoBesar] = useState(null)
  const fotoBesarRef = useRef(null)
  function bukaFoto(e, src) {
    setFotoBesar({ src, asal: e.currentTarget.getBoundingClientRect(), menutup: false })
  }
  function tutupFoto() {
    if (!fotoBesar || fotoBesar.menutup) return
    const el = fotoBesarRef.current
    const asal = fotoBesar.asal
    if (el && el.animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      const akhir = el.getBoundingClientRect()
      el.animate(
        [
          { transform: 'none', opacity: 1 },
          { transform: `translate(${asal.left + asal.width / 2 - (akhir.left + akhir.width / 2)}px, ${asal.top + asal.height / 2 - (akhir.top + akhir.height / 2)}px) scale(${asal.width / akhir.width}, ${asal.height / akhir.height})`, opacity: 0.4 },
        ],
        { duration: 220, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' }
      )
    }
    setFotoBesar((f) => (f ? { ...f, menutup: true } : f))
    setTimeout(() => setFotoBesar(null), 230)
  }
  useEffect(() => {
    const el = fotoBesarRef.current
    if (!fotoBesar || fotoBesar.menutup || !el || !el.animate) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const akhir = el.getBoundingClientRect()
    const asal = fotoBesar.asal
    el.animate(
      [
        { transform: `translate(${asal.left + asal.width / 2 - (akhir.left + akhir.width / 2)}px, ${asal.top + asal.height / 2 - (akhir.top + akhir.height / 2)}px) scale(${asal.width / akhir.width}, ${asal.height / akhir.height})` },
        { transform: 'none' },
      ],
      { duration: 340, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)' }
    )
  }, [fotoBesar?.src]) // eslint-disable-line react-hooks/exhaustive-deps
  // Ikon meluncur dari tempat dilepas ke pojok tujuan. Dijalankan lewat Web Animations pada elemen
  // yang sama (tanpa key), karena membuat ulang tombol di tengah gestur memutus jari dari tombolnya.
  useEffect(() => {
    const el = gelembungRef.current
    if (!mendarat || !el || !el.animate) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    el.animate(
      [
        { transform: `translate3d(${mendarat.dx}px, ${mendarat.dy}px, 0) scale(1.15)` },
        { transform: 'translate3d(0, 0, 0) scale(1)' },
      ],
      { duration: 320, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' }
    )
  }, [mendarat])
  const { isDemo } = useAuth()
  const lokasiOjek = useLokasiOjek()
  const lokasiSaya = useLokasiPenumpang()
  const { pesan, hapusPesan } = usePesanOjek()
  const { pesan: pesanSaya, hapusPesan: hapusPesanSaya, kirimPesan: kirimPesanSaya } = usePesanPenumpang()
  const riwayatChat = useRiwayatChat(pesan, pesanSaya)
  // Pesan dari lawan bicara yang waktunya lewat batas ini ditandai "BARU" di dalam kotak chat.
  // Batasnya diambil saat kotak dibuka (atau saat app dimuat), jadi pesan yang masuk selagi
  // chat terlipat, dan yang datang sesudah dibuka, kelihatan jelas mana yang belum dibaca.
  const [batasBaru, setBatasBaru] = useState(() => riwayatChat.reduce((m, p) => Math.max(m, p.waktu), 0))
  const chatScrollRef = useRef(null)
  // Gulir ke pesan terbawah. Diulang satu frame kemudian karena tinggi isi baru stabil setelah tata letak selesai
  // (misalnya saat halaman dibuka lagi dari tab lain), dan setelah foto selesai dimuat.
  const gulirKeBawah = () => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }
  // Dipicu oleh pesan terakhir (bukan jumlah pesan, yang berhenti naik saat riwayat penuh 30). Diulang
  // beberapa kali karena tinggi isi masih berubah selama animasi masuk dan pemuatan foto.
  const idPesanTerakhir = riwayatChat[riwayatChat.length - 1]?.id
  useEffect(() => {
    gulirKeBawah()
    const rAF = requestAnimationFrame(gulirKeBawah)
    const jeda = [120, 380].map((ms) => setTimeout(gulirKeBawah, ms))
    return () => {
      cancelAnimationFrame(rAF)
      jeda.forEach(clearTimeout)
    }
  }, [idPesanTerakhir, chatBuka])
  // Selama chat terbuka semua pesan dianggap sudah dibaca. Saat terlipat, yang dihitung
  // cuma pesan baru dari lawan bicara (Ahyan), seperti notifikasi.
  useEffect(() => {
    if (chatBuka) setChatDilihat(riwayatChat.reduce((m, p) => Math.max(m, p.waktu), 0))
  }, [chatBuka, riwayatChat])
  const chatBelumDibaca = chatBuka ? 0 : riwayatChat.filter((p) => p.siapa === 'ojek' && p.waktu > chatDilihat).length
  // Menutup chat langsung tanpa animasi keluar, supaya isi kotak tidak terlihat berubah di tengah jalan.
  function tutupChat() {
    setChatBuka(false)
    setKosongDibuka(false)
    setKosongDibuka(false)
  }
  // Baris yang sudah ada waktu kotak dibuka tidak dianimasikan lagi (isi tidak ikut bergerak naik);
  // hanya pesan yang datang sesudahnya yang masuk dengan gerak.
  // Saat halaman dibuka lagi, semua pesan yang sudah ada dianggap lama (tidak dianimasikan naik).
  const idSudahAda = useRef(new Set(riwayatChat.map((p) => p.id)))
  function bukaChat() {
    idSudahAda.current = new Set(riwayatChat.map((p) => p.id))
    setBatasBaru(chatDilihat)
    setChatBuka(true)
    setKosongDibuka(true)
    setKosongDibuka(true)
  }
  function slotTerdekat(x, y) {
    let terbaik = slotChat
    let jarakMin = Infinity
    SLOT_CHAT.forEach((slot) => {
      const rect = slotRefs.current[slot]?.getBoundingClientRect()
      if (!rect) return
      const jarak = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2))
      if (jarak < jarakMin) {
        jarakMin = jarak
        terbaik = slot
      }
    })
    return terbaik
  }
  function mulaiTahan(e) {
    if (e.button != null && e.button !== 0) return
    const el = e.currentTarget
    const pointerId = e.pointerId
    awalTahanRef.current = { x: e.clientX, y: e.clientY }
    clearTimeout(tahanRef.current)
    tahanRef.current = setTimeout(() => {
      try { el.setPointerCapture(pointerId) } catch { /* pointer sudah lepas */ }
      navigator.vibrate?.(15)
      sedangSeretRef.current = true
      sorotRef.current = slotChat
      posSeretRef.current = awalTahanRef.current
      setMendarat(null)
      setSeret({ sorot: slotChat })
    }, 350)
  }
  function geserTahan(e) {
    if (!sedangSeretRef.current) {
      const awal = awalTahanRef.current
      if (awal && Math.hypot(e.clientX - awal.x, e.clientY - awal.y) > 10) clearTimeout(tahanRef.current)
      return
    }
    // Ikon digeser langsung lewat transform (tanpa render ulang React, supaya tidak lag);
    // render ulang hanya saat kotak tujuan yang menyala berganti.
    posSeretRef.current = { x: e.clientX, y: e.clientY }
    const awal = awalTahanRef.current
    if (gelembungRef.current) gelembungRef.current.style.transform = `translate3d(${e.clientX - awal.x}px, ${e.clientY - awal.y}px, 0)`
    const sorot = slotTerdekat(e.clientX, e.clientY)
    if (sorot !== sorotRef.current) {
      navigator.vibrate?.(8)
      sorotRef.current = sorot
      setSeret({ sorot })
    }
  }
  function lepasTahan() {
    clearTimeout(tahanRef.current)
    if (!sedangSeretRef.current) return
    sedangSeretRef.current = false
    baruSeretRef.current = true
    setTimeout(() => { baruSeretRef.current = false }, 350)
    const tujuan = sorotRef.current
    if (gelembungRef.current) gelembungRef.current.style.transform = ''
    // Ikon meluncur dari tempat dilepas ke pojok tujuan (dihitung dari selisih posisinya).
    const rect = slotRefs.current[tujuan]?.getBoundingClientRect()
    if (rect) {
      setMendarat({
        id: Date.now(),
        dx: Math.round(posSeretRef.current.x - (rect.left + rect.width / 2)),
        dy: Math.round(posSeretRef.current.y - (rect.top + rect.height / 2)),
      })
    }
    setSlotChat(tujuan)
    try { localStorage.setItem(KUNCI_SLOT_CHAT, tujuan) } catch { /* abaikan */ }
    setSeret(null)
  }
  function klikGelembung() {
    if (baruSeretRef.current) return
    bukaChat()
  }
  const { ikonAhyan, ikonFajri } = useProfilIkon()
  const { warnaAhyan, warnaFajri } = useWarnaGlow()
  const warnaAktif = ambilWarnaGlow(warnaAhyan)
  const warnaAktifFajri = ambilWarnaGlow(warnaFajri)
  const ikonOjek = useMemo(() => buatIkonOjek(ikonAhyan, warnaAktif), [ikonAhyan, warnaAktif])
  const ikonSaya = useMemo(() => buatIkonSaya(ikonFajri, warnaAktifFajri), [ikonFajri, warnaAktifFajri])
  const posisiAwal = useMemo(() => ambilPetaTerakhir(KEY_PETA_TERAKHIR, PUSAT_DEFAULT, 15), [])
  const posisiValid = lokasiOjek?.lat != null && lokasiOjek?.lng != null
  const posisiSayaValid = lokasiSaya?.lat != null && lokasiSaya?.lng != null
  // Posisi marker dibikin stabil (array sama selama lat/lng sama). Kalau array
  // baru tiap render, Leaflet nganggep posisi berubah tiap render dan ngegeser
  // ulang marker (dan popup yang kebuka di atasnya) terus-terusan.
  const posisiOjekMarker = useMemo(
    () => (posisiValid ? [lokasiOjek.lat, lokasiOjek.lng] : null),
    [posisiValid, lokasiOjek?.lat, lokasiOjek?.lng]
  )
  const posisiSayaMarker = useMemo(
    () => (posisiSayaValid ? [lokasiSaya.lat, lokasiSaya.lng] : null),
    [posisiSayaValid, lokasiSaya?.lat, lokasiSaya?.lng]
  )
  const adaPosisiOjek = posisiValid && permintaan?.status === STATUS_PERMINTAAN.DITERIMA
  const markerOfficeRef = useRef(null)
  const markerKampusRef = useRef(null)
  const mapRefInternal = useRef(null)
  const mapRef = mapRefLuar || mapRefInternal
  // Tinggi dasar peta yang tertutup kartu status (ikut berubah saat kartu dibuka/ditutup) dan dock.
  const overlayRef = useRef(null)
  const [bawahTertutup, setBawahTertutup] = useState(100)
  useEffect(() => {
    const el = overlayRef.current
    if (!el || !el.parentElement) {
      setBawahTertutup(100)
      return undefined
    }
    const ukur = () => {
      const induk = el.parentElement.getBoundingClientRect()
      setBawahTertutup(Math.max(0, Math.round(induk.bottom - el.getBoundingClientRect().top)) + 8)
    }
    ukur()
    const pengamat = new ResizeObserver(ukur)
    pengamat.observe(el)
    window.addEventListener('resize', ukur)
    return () => {
      pengamat.disconnect()
      window.removeEventListener('resize', ukur)
    }
  }, [tampilkanOverlay, permintaan?.status, kartuBuka])
  const bubbleAhyan = useBubblePesan(pesan, hapusPesan, 'peta-fajri:bubble-ahyan')
  const bubbleSaya = useBubblePesan(pesanSaya, hapusPesanSaya, 'peta-fajri:bubble-fajri')

  // Teks & foto sama-sama diturunkan langsung dari pesan (bukan state terpisah)
  // supaya popup gak sempat dirender kosong sesaat saat pesan berganti, karena
  // popup yang terlepas memicu popupclose dan menghapus pesan barunya.
  const teksBubble = pesan?.teks ?? ''
  const teksBubbleSaya = pesanSaya?.teks ?? ''
  const fotoBubble = pesan?.foto ?? ''
  const fotoBubbleSaya = pesanSaya?.foto ?? ''
  const suaraBubble = pesan?.suara ?? ''
  const suaraBubbleSaya = pesanSaya?.suara ?? ''

  return (
    <div ref={wrapRef} style={s.wrap}>
      <MapContainer
        ref={mapRef}
        center={posisiAwal.center}
        zoom={posisiAwal.zoom}
        minZoom={5}
        maxZoom={22}
        maxBounds={BATAS_PETA}
        maxBoundsViscosity={1.0}
        style={s.map}
        zoomControl={false}
        attributionControl={false}
        dragging={true}
        scrollWheelZoom={true}
      >
        <SimpanPosisiPeta />
        <TandaiGeserUser />
        <PusatkanKeSaya sinyal={sinyalLive} posisi={posisiSayaMarker} />
        <PenunjukKarakter posisi={posisiSayaMarker} ikon={{ file: ikonFajri, w: 16, h: 24 }} label={t.ariaKembaliKarakterSaya} bawah={bawahTertutup} />
        {adaPosisiOjek && <PenunjukKarakter posisi={posisiOjekMarker} ikon={{ file: ikonAhyan, w: 24, h: 24 }} label={t.ariaKembaliLokasiDriver} bawah={bawahTertutup} />}

        <TileLayer
          maxNativeZoom={22}
          maxZoom={22}
          // Alamat tanpa "256/" mengirim kotak 512 px (sekitar 4x lebih berat, 100-130 KB per kotak di zoom jauh), padahal
          // ditampilkan 256 px. Di zoom 15 ke bawah dipakai kotak 256 px (sekitar 30 KB) supaya peta cepat terisi;
          // di zoom dekat (16+) isi kotaknya sedikit, jadi tetap pakai yang 512 px supaya tajam di layar HP.
          ukuran={(d) => (d.z <= 13 ? '256/' : '')}
          updateWhenZooming={false}
          url={`https://api.maptiler.com/maps/streets-v4-dark/{ukuran}{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
        />

        {adaPosisiOjek && (
          <>
            <GeserKePosisi lat={lokasiOjek.lat} lng={lokasiOjek.lng} />
            <Marker
              ref={bubbleAhyan.refMarker}
              position={posisiOjekMarker}
              icon={ikonOjek}
              zIndexOffset={1000}
              eventHandlers={bubbleAhyan.eventHandlers}
            >
              {(teksBubble || fotoBubble || suaraBubble) && (
<Popup closeButton={false} autoClose={false} closeOnClick={false} autoPan={false}>
<BubblePesan teks={teksBubble} foto={fotoBubble} suara={suaraBubble} durasi={pesan?.durasiSuara} onTutup={bubbleAhyan.tutup} geser={geserPopupFoto} />
</Popup>
)}
            </Marker>
          </>
        )}

        {posisiSayaValid && (
          <Marker
            ref={bubbleSaya.refMarker}
            position={posisiSayaMarker}
            icon={ikonSaya}
            zIndexOffset={500}
            eventHandlers={bubbleSaya.eventHandlers}
          >
            {(teksBubbleSaya || fotoBubbleSaya || suaraBubbleSaya) && (
<Popup closeButton={false} autoClose={false} closeOnClick={false} autoPan={false}>
<BubblePesan teks={teksBubbleSaya} foto={fotoBubbleSaya} suara={suaraBubbleSaya} durasi={pesanSaya?.durasiSuara} cermin onTutup={bubbleSaya.tutup} geser={geserPopupCermin(44)} geserTeks={geserPopupTeksCermin(44)} />
</Popup>
)}
          </Marker>
        )}

        {posisiSayaValid && (
          <QuickChatMarker
            marker={bubbleSaya.marker}
            siap={Boolean(bubbleSaya.marker)}
            ikon={ikonSaya}
            aktif
            onKirim={kirimPesanSaya}
            pesanCepat={isDemo ? t.quickChatPesanPenumpangDemo : t.quickChatPesanPenumpang}
          />
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

      {tampilkanOverlay && permintaan?.status === STATUS_PERMINTAAN.DITERIMA && (
        chatBuka && (riwayatChat.length > 0 || kosongDibuka) ? (
          <div className="chat-buka" style={{ ...s.kotakChat, ...gayaSlot(slotChat, bawahTertutup), transformOrigin: ASAL_TRANSFORM[slotChat] }}>
            <div style={s.kotakChatKepala}>
              <span style={s.kotakChatJudul}>{t.judulChat}</span>
              <button className="tekan" style={s.kotakChatX} onClick={tutupChat} aria-expanded="true" aria-label={t.ariaBukaChat}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div ref={chatScrollRef} className="no-scrollbar" style={s.kotakChatIsi} role="log" aria-live="polite">
              {riwayatChat.length === 0 && (
                <div style={s.chatKosong}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
                    <path d="M4 5h16v11H9l-5 4z" />
                  </svg>
                  <div>
                    <div style={s.chatKosongJudul}>{t.chatKosong}</div>
                    <div style={s.chatKosongInfo}>{t.chatKosongInfo}</div>
                  </div>
                </div>
              )}
              {riwayatChat.map((p) => (
                <div key={p.id} className={idSudahAda.current.has(p.id) ? undefined : 'naik-masuk'} style={{ ...s.chatBaris, ...(p.siapa === 'ojek' && p.waktu > batasBaru ? s.chatBarisBaru : null), ...(typeof p.suara === 'string' ? { flexWrap: 'wrap', rowGap: 0 } : null) }}>
                  <span style={s.chatTeks}>
                    <span style={p.siapa === 'ojek' ? s.chatNamaOjek : s.chatNamaSaya}>
                      {p.siapa === 'ojek' ? (isDemo ? 'Driver' : 'Ahyan') : (isDemo ? 'Passenger' : 'Fajri')}
                    </span>
                    <span style={s.chatTitikDua}>: </span>
                    {typeof p.suara === 'string' ? null : p.suara ? t.chatSuara : typeof p.foto === 'string' ? <img src={p.foto} alt={t.chatFoto} style={s.chatFotoMini} onLoad={gulirKeBawah} onClick={(e) => bukaFoto(e, p.foto)} /> : p.foto ? t.chatFoto : p.teks}
                  </span>
                  <span style={s.chatJam}>{formatJam(p.waktu)}</span>
                  {typeof p.suara === 'string' && (
                    <span style={s.chatSuaraBaris}>
                      <PemutarSuara src={p.suara} durasi={p.durasi} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
          <button
            ref={gelembungRef}
            className={seret ? undefined : 'tekan gelembung-masuk'}
            style={{
              ...s.tombolGelembung,
              ...gayaSlot(slotChat, bawahTertutup),
              touchAction: 'none',
              userSelect: 'none',
              WebkitTouchCallout: 'none',
              ...(seret && wrapRef.current
                ? { top: awalTahanRef.current.y - wrapRef.current.getBoundingClientRect().top - 24, left: awalTahanRef.current.x - wrapRef.current.getBoundingClientRect().left - 24, right: 'auto', bottom: 'auto', transition: 'none', animation: 'none', zIndex: 1200, borderColor: 'var(--glow-blue)', willChange: 'transform' }
                : null),
            }}
            onClick={klikGelembung}
            onPointerDown={mulaiTahan}
            onPointerMove={geserTahan}
            onPointerUp={lepasTahan}
            onPointerCancel={lepasTahan}
            onContextMenu={(e) => e.preventDefault()}
            aria-expanded="false"
            aria-label={t.ariaBukaChat}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
              <path d="M4 5h16v11H9l-5 4z" />
            </svg>
            {chatBelumDibaca > 0 && <span key={chatBelumDibaca} className="lencana-pop" style={s.lencanaChat}>{chatBelumDibaca > 9 ? '9+' : chatBelumDibaca}</span>}
          </button>
          {seret && SLOT_CHAT.map((slot) => (
            <div
              key={slot}
              ref={(el) => { slotRefs.current[slot] = el }}
              aria-hidden="true"
              style={{
                position: 'absolute',
                zIndex: 1090,
                width: 48,
                height: 48,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--glow-blue)',
                // Bayangan ikon chat: jelas benda apa yang mendarat. Pojok terdekat menyala.
                border: seret.sorot === slot ? '1px solid var(--glow-blue)' : '1px dashed rgba(94,208,255,0.35)',
                background: seret.sorot === slot ? 'rgba(94,208,255,0.18)' : 'transparent',
                boxShadow: seret.sorot === slot ? '0 0 14px rgba(94,208,255,0.55)' : 'none',
                transition: 'background 0.12s, box-shadow 0.12s, border-color 0.12s',
                pointerEvents: 'none',
                ...gayaSlot(slot, bawahTertutup),
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ opacity: seret.sorot === slot ? 1 : 0.35, transition: 'opacity 0.12s' }}>
                <path d="M4 5h16v11H9l-5 4z" />
              </svg>
            </div>
          ))}
          </>
        )
      )}

      {fotoBesar && createPortal(
        <div
          className={fotoBesar.menutup ? 'foto-latar-keluar' : 'foto-latar-masuk'}
          style={s.latarFoto}
          onClick={tutupFoto}
          onContextMenu={(e) => e.preventDefault()}
          role="dialog"
          aria-modal="true"
        >
          <img ref={fotoBesarRef} src={fotoBesar.src} alt={t.chatFoto} style={s.fotoPenuh} draggable={false} />
        </div>,
        document.body
      )}

      {tampilkanOverlay && (
        <div ref={overlayRef} style={s.overlay}>
          {!permintaan && !transisiBatal && (
            <TabStatus merah={baruDibatalkan}>
              <img src={`/icons/${ikonAhyan}`} style={s.idleLogo} alt="" />
              <TeksTab teks={baruDibatalkan ? t.perjalananDibatalkan : t.belumAdaPerjalanan} ulangMs={8000} />
            </TabStatus>
          )}

          {(permintaan?.status === STATUS_PERMINTAAN.MENUNGGU || animDiterima || transisiBatal) && (
            <SpideyMenunggu tanpaWhoosh={baruDibatalkan} dibuatPada={dibuatPadaRef.current} diterima={animDiterima}dibatalkan={transisiBatal} menyusut={susutBatal} isDemo={isDemo} gayaTolak={transisiTolak} info={permintaan ? { aksi: permintaan.aksi === AKSI.JEMPUT ? t.jemput : t.antar, waktu: permintaan.waktu, where: permintaan.where } : null} teks={transisiTolak ? { batal: t.spideyTolak, batalSub: isDemo ? t.spideyTolakSubDemo : t.spideyTolakSub } : null} />
          )}

          {permintaan?.status === STATUS_PERMINTAAN.DITOLAK && !transisiBatal && (
            <TabStatus merah>
              <img src={`/icons/${ikonAhyan}`} style={s.tolakAvatar} alt="" />
              <TeksTab teks={isDemo ? t.driverBelumBisa : t.ahyanBelumBisa} />
            </TabStatus>
          )}

          {permintaan?.status === STATUS_PERMINTAAN.DITERIMA && !animDiterima && (
            <div className="naik-masuk" style={kartuBuka ? s.kartuLiveBuka : s.kartuLive}>
              <button
                className="tekan"
                style={s.stripLive}
                onClick={() => setKartuBuka((b) => !b)}
                aria-expanded={kartuBuka}
                aria-label={t.ariaBukaDetailStatus}
              >
                <span style={s.stripKiri}>
                  <span style={s.dotHijau} />
                  <img src={`/icons/${ikonAhyan}`} style={s.liveAvatar} alt="" />
                  <span><TeksMengetik teks={adaPosisiOjek ? t.otwText : t.ahyanUdahTerima} ulangMs={8000} /></span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow-blue)" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true" style={{ transform: kartuBuka ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                  <path d="M6 15l6-6 6 6" />
                </svg>
              </button>
              {kartuBuka && (
                <div className="naik-masuk" style={s.isiLive}>
                  <div style={s.detailLive}>
                    <span style={s.chipAksi}>{String(permintaan.aksi === 'jemput' ? t.jemput : t.antar).toUpperCase()}</span>
                    {permintaan.where && (
                      <span style={s.tempatLive}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true" style={{ flexShrink: 0 }}>
                          <path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <span style={s.tempatTeks}>{permintaan.where}</span>
                      </span>
                    )}
                    {permintaan.waktu && (
                      <span style={s.jamLive}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        {permintaan.waktu}
                      </span>
                    )}
                  </div>
                  {isiKartu}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Status di sudut kiri atas dock, bergaya tab map: sisi kanannya miring, dan keluar naik dari dalam dock.
// Pembungkus memotong isinya (overflow) supaya geraknya terlihat muncul dari balik dock, dan turun 12px
// (margin negatif) agar dasarnya tepat menempel di tepi atas dock. Garis tepi merah untuk keadaan gagal.
function TabStatus({ merah = false, children }) {
  return (
    <div style={s.tabLuar}>
      <div className="tab-status-naik" style={{ ...s.tabDalam, borderColor: merah ? 'rgba(255, 112, 112, 0.7)' : 'rgba(96, 192, 240, 0.45)' }}>
        {children}
      </div>
    </div>
  )
}

// Teks berefek ketik di dalam TabStatus. Teks penuh dipasang tak terlihat di kotak yang sama supaya lebar
// chip tetap dari awal dan tidak melebar tiap huruf.
function TeksTab({ teks, ulangMs }) {
  return (
    <span style={s.teksTab}>
      <span style={{ visibility: 'hidden', gridArea: '1 / 1' }}>: {teks}</span>
      <span style={{ gridArea: '1 / 1' }}>: <TeksMengetik teks={teks} ulangMs={ulangMs} /></span>
    </span>
  )
}

const s = {
  wrap: { position: 'absolute', inset: 0 },
  map: { height: '100%', width: '100%' },
  overlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 'calc(var(--safe-bottom) + 86px)',
    zIndex: 1100,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
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
  // Chip kecil selebar isinya di kiri atas dock. Latarnya biru panel yang sama dengan kartu setelah pesanan diterima.
  tabLuar: { alignSelf: 'flex-start', maxWidth: 'calc(100% - 12px)', marginLeft: 12, marginBottom: -12, height: 32, overflow: 'hidden', position: 'relative' },
  tabDalam: {
    height: 32, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 0 10px',
    background: '#011A29', border: '1px solid', borderBottom: 'none', borderRadius: 0,
    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 0 100%)',
    color: '#fff', fontSize: 13, textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)',
  },
  teksTab: { minWidth: 0, display: 'inline-grid', overflow: 'hidden', whiteSpace: 'nowrap' },
  idleLogo: {
    flexShrink: 0,
    width: 22,
    height: 22,
    objectFit: 'contain',
  },
  tolakAvatar: {
    flexShrink: 0,
    width: 22,
    height: 22,
    objectFit: 'contain',
  },
  // Chat di kanan atas peta. Terbuka: kotak dengan tombol X. Terlipat: satu ikon gelembung
  // dengan lencana jumlah pesan baru (hilang kalau tidak ada).
  kotakChat: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 14px)',
    right: 14,
    width: 'min(172px, 46%)',
    zIndex: 1100,
    boxSizing: 'border-box',
    background: 'rgba(1,42,64,0.45)',
    border: '1px solid rgba(96, 192, 240, 0.25)',
    padding: '0 8px 6px',
  },
  kotakChatKepala: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 40 },
  kotakChatJudul: {
    fontFamily: 'var(--font-data)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--glow-blue)',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
  },
  kotakChatX: {
    width: 32,
    height: 32,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text)',
    background: 'rgba(1, 42, 64, 0.6)',
  },
  tombolGelembung: {
    position: 'absolute',
    top: 'calc(var(--safe-top) + 14px)',
    right: 14,
    zIndex: 1100,
    width: 48,
    height: 48,
    background: 'rgba(1,42,64,0.45)',
    border: '1px solid rgba(96, 192, 240, 0.25)',
    color: 'var(--glow-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lencanaChat: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 18,
    boxSizing: 'border-box',
    textAlign: 'center',
    background: 'var(--nav-red)',
    color: '#fff',
    padding: '2px 5px',
    fontFamily: 'var(--font-data)',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  chatSuaraBaris: { flexBasis: '100%', marginTop: 1 },
  chatFotoMini: { cursor: 'zoom-in', display: 'block', marginTop: 4, maxWidth: '100%', maxHeight: 84, objectFit: 'cover', border: '1px solid rgba(96, 192, 240, 0.4)' },
  latarFoto: { position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' },
  fotoPenuh: { maxWidth: '92vw', maxHeight: '82vh', objectFit: 'contain', display: 'block', border: '2px solid var(--glow-blue)', background: '#000' },
  // Pesan baru dari lawan bicara: garis cyan di sisi kiri dan latar cyan tipis.
  chatBarisBaru: { background: 'rgba(94, 208, 255, 0.14)', borderLeft: '3px solid var(--glow-blue)', padding: '2px 4px 2px 5px', margin: '0 -4px 0 -8px' },
  kotakChatIsi: {
    maxHeight: 'min(112px, 16vh)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  },
  chatKosong: { display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0 4px', color: 'var(--text-dim)' },
  chatKosongJudul: { fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)' },
  chatKosongInfo: { fontSize: 11, lineHeight: 1.35, marginTop: 3, color: 'var(--text-dim)' },
  chatBaris: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, fontSize: 12, lineHeight: 1.3, color: 'var(--text)', textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)' },
  chatTeks: { minWidth: 0, overflowWrap: 'anywhere' },
  chatJam: { flexShrink: 0, fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-dim)', paddingTop: 2 },
  chatNamaOjek: { fontWeight: 700, color: 'var(--merah-teks)' },
  chatNamaSaya: { fontWeight: 700, color: 'var(--glow-blue)' },
  chatTitikDua: { color: 'var(--text-dim)' },
  kartuLive: { background: 'var(--panel)', color: 'var(--text)' },
  kartuLiveBuka: { background: 'var(--panel)', color: 'var(--text)', borderTop: '3px solid var(--nav-red)' },
  stripLive: {
    width: '100%', minHeight: 40, padding: '0 12px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    fontSize: 13.5, fontWeight: 600, textAlign: 'left',
  },
  stripKiri: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  dotHijau: { width: 8, height: 8, borderRadius: '50%', background: 'var(--signal)', flexShrink: 0 },
  isiLive: { padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 },
  detailLive: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' },
  chipAksi: { flexShrink: 0, fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', background: 'var(--nav-red)', color: '#fff', padding: '2px 6px' },
  tempatLive: { display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, fontWeight: 600 },
  tempatTeks: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  jamLive: { marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 700, color: 'var(--glow-blue)' },
  liveAvatar: { flexShrink: 0, width: 22, height: 22, objectFit: 'contain' },
  badgeLive: {
    background: 'var(--panel)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600,
    padding: '10px 14px', borderRadius: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    border: '1px solid var(--signal)',
  },
}