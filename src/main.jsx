import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
