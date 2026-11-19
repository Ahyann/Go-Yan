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
