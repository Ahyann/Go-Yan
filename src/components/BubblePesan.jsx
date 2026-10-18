import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Bubble foto pakai /icons/bubblefoto.png (30x26 px, ditampilkan 3x).
// Jendela fotonya (area putih yang aman dari sudut membulat) 20x15 px
// (4:3) di x=5, y=3.
// Wrapper dibuat selebar bubble teks (96 px) dan bingkainya digeser supaya
// ujung ekor di kiri bawah jatuh di titik yang sama dengan ekor bubble teks,
// berapa pun SKALA-nya.
const SKALA = 3
const LEBAR_WRAPPER = 96
const GESER_X = 6 - 2 * SKALA
// Resolusi kanvas hasil gabungan, kelipatan skala tampil biar bingkai tetap tajam.
const RESOLUSI = SKALA * 2
const LEBAR_PNG = 30
const TINGGI_PNG = 26
const JENDELA = { x: 5, y: 3, lebar: 20, tinggi: 15 }

// Kalau bagian dalam bingkai di PNG transparan (cuma sisa 1 px putih
// pembungkus foto), foto dilukis per piksel ke dalam bentuk bingkainya, jadi
// ikut sudut pixel-nya dan ikut pixelated. Kalau dalamnya masih putih padat,
// dipakai tata letak lama (foto di jendela kecil di atas bingkai).
let bingkaiPromise = null

function muatBingkai() {
  if (!bingkaiPromise) {
    bingkaiPromise = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = LEBAR_PNG
        c.height = TINGGI_PNG
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, LEBAR_PNG, TINGGI_PNG)
        resolve({ kanvas: c, area: cariAreaDalam(data) })
      }
      img.onerror = () => resolve(null)
      img.src = '/icons/bubblefoto.png'
    })
  }
  return bingkaiPromise
}

// Flood fill dari tengah badan bubble lewat piksel transparan. Kalau bocor
// sampai tepi gambar, berarti bagian dalamnya gak tertutup, jadi dianggap gak ada.
function cariAreaDalam({ data }) {
  const a = (x, y) => data[(y * LEBAR_PNG + x) * 4 + 3]
  const mulaiX = Math.floor(LEBAR_PNG / 2)
  const mulaiY = Math.floor(TINGGI_PNG / 3)
  if (a(mulaiX, mulaiY) > 10) return null
  const area = new Uint8Array(LEBAR_PNG * TINGGI_PNG)
  const tumpuk = [[mulaiX, mulaiY]]
  while (tumpuk.length) {
    const [x, y] = tumpuk.pop()
    if (x < 0 || y < 0 || x >= LEBAR_PNG || y >= TINGGI_PNG) return null
    const i = y * LEBAR_PNG + x
    if (area[i] || a(x, y) > 10) continue
    area[i] = 1
    tumpuk.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  let x0 = LEBAR_PNG, y0 = TINGGI_PNG, x1 = 0, y1 = 0
  for (let y = 0; y < TINGGI_PNG; y++) {
    for (let x = 0; x < LEBAR_PNG; x++) {
      if (!area[y * LEBAR_PNG + x]) continue
      x0 = Math.min(x0, x); x1 = Math.max(x1, x)
      y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    }
  }
  return { area, x0, y0, lebar: x1 - x0 + 1, tinggi: y1 - y0 + 1 }
}

function useFotoPiksel(foto, cermin) {
  const [hasil, setHasil] = useState(null)

  useEffect(() => {
    let batal = false
    setHasil(null)
    Promise.all([
      muatBingkai(),
      new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = foto
      }),
    ]).then(([bingkai, img]) => {
      if (batal || !bingkai?.area || !img) return
      const { kanvas, area } = bingkai
      const { x0, y0, lebar, tinggi } = area

      // Bingkai digambar tajam (kotak-kotak) tapi foto dilukis halus di
      // resolusi lebih tinggi, dipotong mengikuti bentuk area dalam bingkai,
      // jadi sudutnya tetap pixel tapi fotonya gak pecah.
      const R = RESOLUSI
      const c = document.createElement('canvas')
      c.width = LEBAR_PNG * R
      c.height = TINGGI_PNG * R
      const ctx = c.getContext('2d')

      const rasio = lebar / tinggi
      let sw = img.naturalWidth
      let sh = img.naturalHeight
      if (sw / sh > rasio) sw = sh * rasio
      else sh = sw / rasio

      ctx.save()
      ctx.beginPath()
      for (let y = 0; y < TINGGI_PNG; y++) {
        for (let x = 0; x < LEBAR_PNG; x++) {
          if (area.area[y * LEBAR_PNG + x]) ctx.rect((cermin ? LEBAR_PNG - 1 - x : x) * R, y * R, R, R)
        }
      }
      ctx.clip()
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(
        img,
        (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh,
        (cermin ? LEBAR_PNG - (x0 + lebar) : x0) * R, y0 * R, lebar * R, tinggi * R
      )
      ctx.restore()

      ctx.imageSmoothingEnabled = false
      if (cermin) {
        // Bingkai dibalik kiri-kanan (ekor di kanan bawah), fotonya tidak.
        ctx.translate(LEBAR_PNG * R, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(kanvas, 0, 0, LEBAR_PNG * R, TINGGI_PNG * R)
      setHasil(c.toDataURL('image/png'))
    })
    return () => {
      batal = true
    }
  }, [foto, cermin])

  return hasil
}

// Isi bubble di peta: teks (bubble pixel) atau foto 4:3.
// Teks: klik buat nutup. Foto: klik buat lihat besar, tombol x buat nutup.
// cermin: bingkai foto dibalik (ekor di kanan), buat bubble yang keluar ke kiri.
// Popup bubble foto yang dicerminkan harus ke sisi kiri karakter. Posisi
// tengah popup dibuat sama (-38 px dari tengah karakter) di kedua peta, apa
// pun popupAnchor ikon karakternya (beda di peta Fajri dan peta Ahyan).
const TENGAH_POPUP_CERMIN = -38
// popupAnchor ikon Fajri diturunin 9 px (bubble teks), bubble foto ikut turun,
// jadi geseran ke bawahnya dikurangi 9.
export const geserPopupCermin = (anchorX) => [
  TENGAH_POPUP_CERMIN - anchorX + GESER_KANAN_FOTO,
  GESER_BAWAH_FOTO - 9,
]

// Bubble foto diturunin dikit dari posisi bubble teks supaya ekornya
// pas nempel ke karakter (positif = makin ke bawah, dalam px).
export const GESER_BAWAH_FOTO = 14
// Geser ke kanan (positif = kanan, dalam px), berlaku untuk bubble foto biasa
// maupun yang dicerminkan.
export const GESER_KANAN_FOTO = 4
// Karakter Ahyan ikonnya berjangkar di tengah (popupAnchor y=8), beda dari
// karakter Fajri yang berjangkar di kaki (y=-11), jadi bubble teksnya sudah
// lebih rendah ~7 px dan geseran ke bawahnya lebih kecil. popupAnchor ikon Ahyan
// diturunin 7 px lagi (8 -> 15), dan bubble foto ikut turun, jadi dikurangi 7.
export const GESER_BAWAH_FOTO_AHYAN = GESER_BAWAH_FOTO - 7 - 7
export const geserPopupFoto = [GESER_KANAN_FOTO, GESER_BAWAH_FOTO_AHYAN]

// geser: [x, y] px, menggeser bubble foto dari posisi default popup. Pakai CSS,
// bukan offset Popup Leaflet, supaya popup gak perlu dibuat ulang (dibuat ulang
// bikin popupclose kepanggil dan pesan barunya ikut kehapus).
// Bubble teks yang dicerminkan (Fajri): ekor di kanan bawah, keluar ke sisi
// kiri karakter. Ujung ekor (kolom 30 dari 34 setelah dibalik) harus jatuh di
// sisi kiri karakter, bayangan dari bubble biasa di sisi kanan.
const TENGAH_TEKS_CERMIN = -44
export const geserPopupTeksCermin = (anchorX) => [TENGAH_TEKS_CERMIN - anchorX, 0]

export default function BubblePesan({ teks, foto, onTutup, cermin = false, geser = [0, 0], geserTeks = [0, 0] }) {
  // besar: null (tutup) | { dx, dy, menutup } — dx/dy = jarak bubble dari
  // tengah layar, titik awal foto "muncul maju" dan titik tujuan pas nutup.
  const [besar, setBesar] = useState(null)
  const bukaBesar = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setBesar({
      dx: Math.round(r.left + r.width / 2 - window.innerWidth / 2),
      dy: Math.round(r.top + r.height / 2 - window.innerHeight / 2),
      menutup: false,
    })
  }
  const tutupBesar = () => {
    setBesar((b) => (b ? { ...b, menutup: true } : b))
    setTimeout(() => setBesar(null), 200)
  }
  const fotoPiksel = useFotoPiksel(foto || '', cermin)

  if (foto) {
    return (
      <div
        style={{ ...s.fotoWrap, transform: `translate(${geser[0]}px, ${geser[1]}px)` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Gambarnya sendiri gak nangkep sentuhan (pointer-events: none), yang
            nangkep tap itu lapisan transparan di atasnya. Kalau gambarnya yang
            kena tahan lama, browser nampilin menu "simpan gambar / buka di tab". */}
        {fotoPiksel ? (
          <img src={fotoPiksel} alt="" style={{ ...s.fotoBingkai, backgroundImage: 'none' }} draggable={false} />
        ) : (
          <>
            <div style={s.fotoBingkai} />
            <img src={foto} alt="" style={s.foto} draggable={false} />
          </>
        )}
        <div style={s.fotoTap} onClick={bukaBesar} />
        <button type="button" style={{ ...s.tutup, ...(cermin ? { left: -6 } : null) }} onClick={onTutup} aria-label="Tutup">×</button>
        {besar && createPortal(
          <div
            className={besar.menutup ? 'foto-latar-keluar' : 'foto-latar-masuk'}
            style={s.overlay}
            onClick={tutupBesar}
            onContextMenu={(e) => e.preventDefault()}
          >
            <img
              src={foto}
              alt=""
              className={besar.menutup ? 'foto-besar-keluar' : 'foto-besar-masuk'}
              style={{ ...s.fotoBesar, '--dx': `${besar.dx}px`, '--dy': `${besar.dy}px` }}
              draggable={false}
            />
          </div>,
          document.body
        )}
      </div>
    )
  }

  return (
    <div
      style={{ ...s.bubbleWrap, transform: `translate(${geserTeks[0]}px, ${geserTeks[1]}px)` }}
      onClick={onTutup}
    >
      <div style={{ ...s.bubbleLatar, transform: cermin ? 'scaleX(-1)' : undefined }} />
      <span style={{ ...s.bubbleText, fontSize: teks.length > 16 ? 7 : 9 }}>{teks}</span>
    </div>
  )
}

const s = {
  bubbleWrap: {
    position: 'relative',
    width: 102,
    height: 51,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 14,
    paddingLeft: 6,
    paddingRight: 6,
  },
  bubbleLatar: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(/icons/bubbletext.png)',
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  },
  bubbleText: {
    position: 'relative',
    fontFamily: 'var(--font-pixel)',
    color: '#0B0E1A',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  fotoWrap: {
    position: 'relative',
    width: LEBAR_WRAPPER,
    height: TINGGI_PNG * SKALA,
  },
  fotoBingkai: {
    WebkitTouchCallout: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    position: 'absolute',
    left: GESER_X,
    top: 0,
    width: LEBAR_PNG * SKALA,
    height: TINGGI_PNG * SKALA,
    backgroundImage: 'url(/icons/bubblefoto.png)',
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    pointerEvents: 'none',
  },
  foto: {
    pointerEvents: 'none',
    WebkitTouchCallout: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    position: 'absolute',
    left: GESER_X + JENDELA.x * SKALA,
    top: JENDELA.y * SKALA,
    width: JENDELA.lebar * SKALA,
    height: JENDELA.tinggi * SKALA,
    objectFit: 'cover',
    display: 'block',
    cursor: 'zoom-in',
  },
  tutup: {
    position: 'absolute',
    top: -4,
    left: GESER_X + LEBAR_PNG * SKALA - 10,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#B8242F',
    color: '#fff',
    fontSize: 13,
    lineHeight: '16px',
    fontWeight: 700,
    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000000,
  },
  fotoTap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: LEBAR_PNG * SKALA,
    height: TINGGI_PNG * SKALA,
    cursor: 'zoom-in',
    WebkitTouchCallout: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  fotoBesar: {
    pointerEvents: 'none',
    WebkitTouchCallout: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    width: '100%',
    maxWidth: 480,
    aspectRatio: '4 / 3',
    objectFit: 'contain',
    borderRadius: 10,
  },
}
