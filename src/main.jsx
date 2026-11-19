import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DebugPanel from './components/DebugPanel.jsx'
import { pantauVersiBaru } from './lib/pantauVersiBaru'
import './index.css'

// Tinggi layar pakai innerHeight (tidak ikut mengecil saat keyboard/pop up muncul di iPhone),
// bukan visualViewport yang bisa tersangkut di nilai kecil dan menyisakan area kosong di bawah.
function setTinggiApp() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}
function setTinggiLagi() {
  setTinggiApp()
  ;[150, 600].forEach((ms) => setTimeout(setTinggiApp, ms))
}
// Setelah app dibangunkan dari background (misalnya sudah 30 menit lebih tidak dibuka), iPhone kadang baru
// mengembalikan ukuran layar yang benar beberapa detik kemudian. Jadi tinggi dicek terus selama ~4 detik pertama.
let pemantauBangun = null
function setTinggiSetelahBangun() {
  setTinggiApp()
  window.scrollTo(0, 0)
  clearInterval(pemantauBangun)
  let hitung = 0
  pemantauBangun = setInterval(() => {
    setTinggiApp()
    if (++hitung >= 20) clearInterval(pemantauBangun)
  }, 200)
}
setTinggiLagi()
window.addEventListener('resize', setTinggiApp)
window.addEventListener('orientationchange', setTinggiLagi)
window.addEventListener('load', setTinggiLagi)
window.addEventListener('pageshow', setTinggiSetelahBangun)
window.addEventListener('focus', setTinggiSetelahBangun)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') setTinggiSetelahBangun()
})

pantauVersiBaru()
// Bagian halaman (peta, dll.) mulai diunduh bersamaan dengan pengecekan login, bukan menunggu login selesai dulu.
import('./pages/PenumpangView.jsx')
import('./pages/OjekView.jsx')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <DebugPanel />
  </React.StrictMode>
)
