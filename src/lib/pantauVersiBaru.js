// HP yang masih nyimpen versi app lama bisa bikin bug yang udah diperbaiki
// tetap kejadian (apalagi di chat, karena satu HP yang masih lama bisa
// ngehapus pesan HP lain). Jadi tiap app dibuka lagi / balik ke layar, dicek
// apakah ada versi baru di server, kalau ada langsung dimuat ulang.
const POLA_SKRIP = /\/assets\/index-[\w-]+\.js/

function skripSekarang() {
  return [...document.scripts]
    .map((s) => s.getAttribute('src') || '')
    .find((src) => POLA_SKRIP.test(src))
}

async function cekSekali() {
  try {
    const res = await fetch('/', { cache: 'no-store' })
    const html = await res.text()
    const terbaru = html.match(POLA_SKRIP)?.[0]
    const sekarang = skripSekarang()
    if (!terbaru || !sekarang || sekarang.endsWith(terbaru)) return
    // Sekali saja per versi, biar gak muter-muter kalau ada yang aneh.
    if (sessionStorage.getItem('goyan-muat-ulang') === terbaru) return
    sessionStorage.setItem('goyan-muat-ulang', terbaru)
    window.location.reload()
  } catch {
    // offline atau gagal ambil, abaikan
  }
}

export function pantauVersiBaru() {
  if (!import.meta.env.PROD) return
  cekSekali()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') cekSekali()
  })
  setInterval(cekSekali, 5 * 60 * 1000)
}
