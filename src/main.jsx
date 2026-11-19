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
// Pengaman utama: tiap kali area pandang berubah (keyboard turun, bar Safari bergeser) dan tidak ada input yang
// sedang diketik, halaman dipaksa kembali ke posisi 0 dan tingginya dihitung ulang. Ini yang menutup sisa
// ruang kosong yang kadang masih tertinggal setelah keyboard tertutup.
function pulihkanLayar() {
  const el = document.activeElement
  if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
  const html = document.documentElement
  const vv = window.visualViewport
  const melenceng = vv && (Math.abs(vv.offsetTop) > 0.5 || Math.abs(vv.pageTop) > 0.5 || vv.height < window.innerHeight - 1)
  // Halaman di iPhone tidak bisa dikembalikan lewat scrollTo kalau isinya tidak bisa discroll. Jadi dibuat
  // sebentar bisa discroll (2px lebih tinggi), dikembalikan ke atas, lalu dikunci lagi.
  html.style.minHeight = `${window.innerHeight + 2}px`
  document.body.style.minHeight = `${window.innerHeight + 2}px`
  window.scrollTo(0, 1)
  window.scrollTo(0, 0)
  html.scrollTop = 0
  document.body.scrollTop = 0
  html.style.minHeight = ''
  document.body.style.minHeight = ''
  setTinggiApp()
  if (melenceng) resetViewportMeta()
}
// Memaksa Safari menghitung ulang area pandang dengan mengganti pengaturan meta viewport sesaat.
function resetViewportMeta() {
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return
  const asli = meta.getAttribute('content')
  meta.setAttribute('content', asli.replace('maximum-scale=1.0', 'maximum-scale=1.01'))
  requestAnimationFrame(() => requestAnimationFrame(() => meta.setAttribute('content', asli)))
}
if (window.visualViewport) {
  let tunda
  const jadwalPulih = () => {
    clearTimeout(tunda)
    tunda = setTimeout(pulihkanLayar, 120)
  }
  window.visualViewport.addEventListener('resize', jadwalPulih)
  window.visualViewport.addEventListener('scroll', jadwalPulih)
}
// Keyboard iPhone butuh ~0,4 detik untuk turun, jadi posisi dikembalikan beberapa kali.
document.addEventListener('focusout', () => {
  ;[100, 350, 700].forEach((ms) =>
    setTimeout(() => {
      const el = document.activeElement
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      setTinggiApp()
    }, ms)
  )
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
