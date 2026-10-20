import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useProfilIkon } from '../lib/useProfilIkon'
import { useWarnaGlow } from '../lib/useWarnaGlow'
import { ambilWarnaGlow } from '../lib/warnaGlow'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const KECEPATAN_KETIK_MS = 22
const DURASI_ANIMASI_MASUK_MS = 450 // teks mulai diketik setelah kartu selesai muncul
const DURASI_ANIMASI_KELUAR_MS = 220
const CEK_PETA_MS = 250
const JEDA_SETELAH_PETA_MS = 500
const BATAS_TUNGGU_PETA_MS = 8000 // kalau peta gak kunjung selesai (koneksi jelek), tetap muncul

// Sekali per sesi demo (per akun anonim demo), disimpan di sessionStorage:
// pindah tab atau muat ulang gak munculin lagi, tapi sesi demo baru munculin lagi.
function kunciSesi(uid) {
  return `goyan-demo-selamat-datang-${uid}`
}

function sudahDitutup(uid) {
  try {
    return sessionStorage.getItem(kunciSesi(uid)) === '1'
  } catch {
    return false
  }
}

// Icon spiderman pixel yang lagi dipakai (default spidericon.png), sama kayak
// di peta dan di profil, dengan cahaya warna yang dipilih menempel di
// bentuknya (sama kayak glow di peta).
//
// Cahayanya DIBAKAR ke gambar lewat canvas sebelum pop up tampil, bukan filter
// CSS yang dihitung saat animasi: filter di elemen yang lagi membesar dirender
// kasar dulu (kelihatan kotak) lalu baru dihaluskan beberapa saat kemudian.
const UKURAN_LOGO = 64
const RUANG_CAHAYA = 28 // ruang kosong di sekeliling icon buat cahayanya
const SKALA_BAKAR = 2 // resolusi canvas dibanding ukuran tampil, biar tetap tajam

async function bakarLogoDenganCahaya(src, warna) {
  const img = new Image()
  img.src = src
  await img.decode()
  const sisi = (UKURAN_LOGO + RUANG_CAHAYA * 2) * SKALA_BAKAR
  const kanvas = document.createElement('canvas')
  kanvas.width = sisi
  kanvas.height = sisi
  const ctx = kanvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  const gambar = () =>
    ctx.drawImage(img, RUANG_CAHAYA * SKALA_BAKAR, RUANG_CAHAYA * SKALA_BAKAR, UKURAN_LOGO * SKALA_BAKAR, UKURAN_LOGO * SKALA_BAKAR)
  // Dua lapis, sama kayak drop-shadow(0 0 6px utama) drop-shadow(0 0 12px kuat).
  ctx.shadowColor = warna.kuat
  ctx.shadowBlur = 12 * SKALA_BAKAR
  gambar()
  ctx.shadowColor = warna.utama
  ctx.shadowBlur = 6 * SKALA_BAKAR
  gambar()
  return kanvas.toDataURL('image/png')
}

function LogoSpiderman({ src }) {
  const sisi = UKURAN_LOGO + RUANG_CAHAYA * 2
  return (
    <div style={s.logoKotak}>
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ ...s.logoGambar, width: sisi, height: sisi, margin: -RUANG_CAHAYA }}
      />
    </div>
  )
}

// Pop up sambutan di akun demo: penjelasan singkat cara nyobain demo, tulisannya
// muncul kayak diketik. Ketuk teksnya buat langsung nampilin semuanya.
export default function DemoWelcomePopup() {
  const { t, lang } = useLanguage()
  const { isDemo, user } = useAuth()
  const uid = user?.uid
  const [terbuka, setTerbuka] = useState(() => Boolean(isDemo && uid && !sudahDitutup(uid)))
  const [jumlah, setJumlah] = useState(0)
  const [petaSiap, setPetaSiap] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)
  const [menutup, setMenutup] = useState(false)
  const { ikonAhyan } = useProfilIkon()
  const { warnaAhyan } = useWarnaGlow()
  const warna = ambilWarnaGlow(warnaAhyan)
  const srcLogo = `/icons/${ikonAhyan}`

  // Siapkan logo (gambar + cahaya) dari awal, jauh sebelum pop up tampil, jadi
  // begitu muncul sudah jadi, gak ada kotak kosong atau kotak kasar dulu.
  // Kalau gagal atau lama (batas 3 detik), tampil icon polos tanpa cahaya.
  useEffect(() => {
    let batal = false
    bakarLogoDenganCahaya(srcLogo, warna)
      .then((url) => !batal && setLogoUrl(url))
      .catch(() => !batal && setLogoUrl(srcLogo))
    const batas = setTimeout(() => !batal && setLogoUrl((u) => u ?? srcLogo), 3000)
    return () => {
      batal = true
      clearTimeout(batas)
    }
  }, [srcLogo, warna.utama, warna.kuat])

  // Akun demo bisa baru kebaca setelah komponen dipasang.
  useEffect(() => {
    if (isDemo && uid && !sudahDitutup(uid)) setTerbuka(true)
  }, [isDemo, uid])

  const isi = t.demoSelamatDatangIsi

  // Pop up baru muncul setelah petanya selesai dimuat (semua ubin kelihatan),
  // bukan langsung pas masuk. Dicek langsung dari elemen peta di layar: ada
  // ubin, dan semuanya sudah selesai dimuat, dua pengecekan berturut-turut.
  useEffect(() => {
    if (!terbuka || petaSiap) return
    let aman = 0
    let tundaId = null
    const cek = setInterval(() => {
      const ubin = document.querySelectorAll('.leaflet-tile')
      const semuaSelesai = ubin.length > 0 && document.querySelectorAll('.leaflet-tile:not(.leaflet-tile-loaded)').length === 0
      aman = semuaSelesai ? aman + 1 : 0
      if (aman >= 2) {
        clearInterval(cek)
        tundaId = setTimeout(() => setPetaSiap(true), JEDA_SETELAH_PETA_MS)
      }
    }, CEK_PETA_MS)
    const batas = setTimeout(() => setPetaSiap(true), BATAS_TUNGGU_PETA_MS)
    return () => {
      clearInterval(cek)
      clearTimeout(batas)
      clearTimeout(tundaId)
    }
  }, [terbuka, petaSiap])

  const tampil = terbuka && petaSiap && Boolean(logoUrl)

  useEffect(() => {
    if (!tampil) return
    setJumlah(0)
    let id = null
    const mulai = setTimeout(() => {
      id = setInterval(() => {
        setJumlah((n) => {
          if (n >= isi.length) {
            clearInterval(id)
            return n
          }
          return n + 1
        })
      }, KECEPATAN_KETIK_MS)
    }, DURASI_ANIMASI_MASUK_MS)
    return () => {
      clearTimeout(mulai)
      clearInterval(id)
    }
  }, [tampil, isi])

  function tutup() {
    try {
      sessionStorage.setItem(kunciSesi(uid), '1')
    } catch {
      // penyimpanan diblokir, popup cuma nutup sampai halaman dimuat ulang
    }
    // Animasi keluar dulu, baru dicopot dari layar.
    setMenutup(true)
    setTimeout(() => setTerbuka(false), DURASI_ANIMASI_KELUAR_MS)
  }

  if (!tampil) return null

  const selesaiKetik = jumlah >= isi.length

  return createPortal(
    <div
      className={menutup ? 'demo-latar-keluar' : 'demo-latar-masuk'}
      style={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={t.demoSelamatDatangJudul}
    >
      <div className={menutup ? 'demo-kartu-keluar' : 'demo-kartu-masuk'} style={s.kartu}>
        <div className="demo-logo-masuk" style={s.logo}>
          <LogoSpiderman src={logoUrl} />
        </div>
        <h2 style={s.judul}>{t.demoSelamatDatangJudul}</h2>
        {/* Teks rata kiri-kanan. Bagian yang belum diketik tetap dirender (tapi
            tak kelihatan) supaya pemenggalan barisnya sudah final dari awal:
            gak ada kata yang loncat antar baris dan tinggi kartu gak berubah. */}
        <div style={s.teks} lang={lang} aria-label={isi} onClick={() => setJumlah(isi.length)}>
          {isi.slice(0, jumlah)}
          {!selesaiKetik && (
            <span className="typing-cursor" style={s.kursor}>
              |
            </span>
          )}
          <span style={s.belumDiketik} aria-hidden="true">
            {isi.slice(jumlah)}
          </span>
        </div>
        <button type="button" style={s.tombol} onClick={tutup} disabled={menutup}>
          {t.demoOke}
        </button>
      </div>
    </div>,
    document.body
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5,8,18,0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000001,
  },
  kartu: {
    width: '100%',
    maxWidth: 360,
    background: 'linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))',
    border: '1px solid var(--blue-border)',
    borderRadius: 16,
    padding: '22px 20px 20px',
    boxShadow: '0 0 24px rgba(43,158,232,0.35)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoKotak: { position: 'relative', width: UKURAN_LOGO, height: UKURAN_LOGO },
  logoGambar: {
    display: 'block',
    maxWidth: 'none',
    pointerEvents: 'none',
    WebkitUserDrag: 'none',
  },

  judul: {
    fontFamily: 'var(--font-judul)',
    fontSize: 24,
    letterSpacing: '1px',
    lineHeight: 1.2,
    color: 'var(--glow-blue)',
    textShadow: '0 0 8px var(--glow-blue-mid)',
    textAlign: 'center',
  },
  teks: {
    width: '100%',
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--text)',
    textAlign: 'justify',
    textJustify: 'inter-word',
    hyphens: 'auto',
    WebkitHyphens: 'auto',
    overflowWrap: 'break-word',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  // Kursor gak makan lebar, jadi gak ngubah pemenggalan baris.
  kursor: { display: 'inline-block', width: 0, overflow: 'visible' },
  belumDiketik: { visibility: 'hidden' },
  tombol: {
    marginTop: 4,
    width: '100%',
    background: 'var(--nav-red)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    padding: '13px',
    borderRadius: 999,
  },
}
