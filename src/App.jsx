import { Routes, Route, Navigate } from 'react-router-dom'
import { isFirebaseConfigured } from './lib/firebase'
import SetupCheck from './pages/SetupCheck.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SetupCheck configured={isFirebaseConfigured} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}