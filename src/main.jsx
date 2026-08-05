import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

function setTinggiApp() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}
setTinggiApp()
window.addEventListener('resize', setTinggiApp)
window.addEventListener('orientationchange', setTinggiApp)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setTinggiApp)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)