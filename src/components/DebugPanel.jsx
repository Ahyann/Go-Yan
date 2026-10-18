import { useEffect, useState } from 'react'
import { ambilBaris, debugAktif, dengarkan } from '../lib/debugLog'

// Panel log di atas layar, cuma muncul kalau mode debug nyala (?debug=1).
// Gak nangkep sentuhan, jadi app tetap bisa dipakai di bawahnya.
export default function DebugPanel() {
  const [baris, setBaris] = useState(ambilBaris)

  useEffect(() => dengarkan(() => setBaris(ambilBaris())), [])

  if (!debugAktif) return null

  return (
    <pre style={s.panel}>{baris.slice(-14).join('\n') || 'debug nyala, nunggu kejadian...'}</pre>
  )
}

const s = {
  panel: {
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    maxHeight: '38vh',
    overflow: 'hidden',
    margin: 0,
    padding: '4px 6px',
    background: 'rgba(0,0,0,0.78)',
    color: '#7CFFB0',
    fontFamily: 'monospace',
    fontSize: 9,
    lineHeight: 1.25,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    pointerEvents: 'none',
    zIndex: 2000000,
  },
}
