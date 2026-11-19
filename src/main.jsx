import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DebugPanel from './components/DebugPanel.jsx'
import { pantauVersiBaru } from './lib/pantauVersiBaru'
import './index.css'

function setTinggiApp() {
  const tinggi = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${tinggi}px`)
}
setTinggiApp()
window.addEventListener('resize', setTinggiApp)
window.addEventListener('orientationchange', setTinggiApp)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setTinggiApp)
}

window.addEventListener('pageshow', setTinggiApp)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') setTinggiApp()
})

pantauVersiBaru()

// Service worker yang sama dengan notifikasi; di dalamnya ada cache gambar peta supaya peta cepat terbuka di kunjungan berikutnya.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <DebugPanel />
  </React.StrictMode>
)
