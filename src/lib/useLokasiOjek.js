import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from './firebase'

const LOKASI_REF = ref(rtdb, 'lokasi/ojek')

export function useLokasiOjek() {
  const [lokasi, setLokasi] = useState(null)

  useEffect(() => {
    const berhentiDengar = onValue(LOKASI_REF, (snap) => {
      setLokasi(snap.exists() ? snap.val() : null)
    })
    return berhentiDengar
  }, [])

  return lokasi
}