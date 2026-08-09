import { useEffect, useRef, useState } from 'react'
import { ref, set, update } from 'firebase/database'
import { rtdb } from './firebase'

const LOKASI_REF = ref(rtdb, 'lokasi/penumpang')

export function useLokasiSayaPenumpang() {
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
          aktif: true,
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
    // Posisi TERAKHIR sengaja gak dihapus (icon-nya tetep keliatan)
    // — cuma ditandain "udah gak live lagi".
    update(LOKASI_REF, { aktif: false }).catch(() => {})
  }

  useEffect(() => {
    // Sama kayak sisi Ojek — tandain "gak live" ke server begitu app
    // baru dimuat, TAPI posisi terakhirnya sengaja gak ikut kehapus.
    update(LOKASI_REF, { aktif: false }).catch(() => {})

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { aktif, error, mulai, berhenti }
}
