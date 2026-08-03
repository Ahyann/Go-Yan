import { useEffect, useRef, useState } from 'react'
import { ref, set, remove } from 'firebase/database'
import { rtdb } from './firebase'

const LOKASI_REF = ref(rtdb, 'lokasi/ojek')

export function useLokasiSaya() {
  const [aktif, setAktif] = useState(false)
  const [error, setError] = useState('')
  const watchIdRef = useRef(null)

  function mulai() {
    if (!navigator.geolocation) {
      setError('HP/browser ini gak dukung GPS.')
      return
    }
    setError('')

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        set(LOKASI_REF, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updatedAt: Date.now(),
        })
      },
      (err) => {
        setError('Gagal ambil lokasi: ' + err.message)
        setAktif(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    setAktif(true)
  }

  function berhenti() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setAktif(false)
    remove(LOKASI_REF)
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { aktif, error, mulai, berhenti }
}