import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DebugPanel from './components/DebugPanel.jsx'
import { pantauVersiBaru } from './lib/pantauVersiBaru'
import './index.css'

// Tinggi layar pakai innerHeight (tidak ikut mengecil saat keyboard/pop up muncul di iPhone),
// bukan visualViewport yang bisa tersangkut di nilai kecil dan menyisakan area kosong di bawah.
function setTinggiApp() {
  const el = document.activeElement
  const mengetik = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
  if (mengetik) return
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}
function setTinggiLagi() {
  setTinggiApp()
  setTimeout(setTinggiApp, 150)
  setTimeout(setTinggiApp, 600)
}
setTinggiLagi()
window.addEventListener('resize', setTinggiApp)
window.addEventListener('orientationchange', setTinggiLagi)
window.addEventListener('load', setTinggiLagi)
window.addEventListener('pageshow', setTinggiLagi)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') setTinggiLagi()
})
// Setelah keyboard/pop up input tertutup, kembalikan halaman ke posisi semula dan hitung ulang tinggi.
document.addEventListener('focusout', () => {
  setTimeout(() => {
    window.scrollTo(0, 0)
    setTinggiLagi()
  }, 100)
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
