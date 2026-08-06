import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Fix bug layar hitam kosong di bawah pas app baru dibuka di iOS —
// `100dvh` di CSS kadang belum "settle" bener pas Safari baru mulai
// render, jadi kita itung tinggi layar beneran pake JavaScript
// (window.innerHeight, yang lebih bisa diandelin), simpen ke CSS
// variable, dan update tiap kali ukuran berubah (rotate, keyboard, dst).
function setTinggiApp() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}
setTinggiApp()
window.addEventListener('resize', setTinggiApp)
window.addEventListener('orientationchange', setTinggiApp)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setTinggiApp)
}
// Lapis tambahan: `pageshow` khusus nangkep momen app balik "hidup"
// lagi abis dipindah ke app lain (termasuk kalau browser sempet
// nyimpen halamannya di cache khusus, bfcache) — kondisi yang paling
// sering bikin bug layar hitam ini muncul ulang.
window.addEventListener('pageshow', setTinggiApp)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') setTinggiApp()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
