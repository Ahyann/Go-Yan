import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DebugPanel from './components/DebugPanel.jsx'
import { pantauVersiBaru } from './lib/pantauVersiBaru'
import './index.css'

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
