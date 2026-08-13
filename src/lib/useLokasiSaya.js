import { useEffect, useRef, useState } from 'react'
import { ref, set, remove } from 'firebase/database'
import { rtdb } from './firebase'
import { kirimNotifikasi } from './notifikasi'

const LOKASI_REF = ref(rtdb, 'lokasi/ojek')

const JARAK_MINIMUM_METER = 6

function jarakMeter(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function useLokasiSaya() {
  const [aktif, setAktif] = useState(false)
  const [error, setError] = useState('')
  const watchIdRef = useRef(null)
  const posisiTerakhirRef = useRef(null)

  function mulai() {
    if (!navigator.geolocation) {
      setError('HP/browser ini gak dukung GPS.')
      return
    }
    setError('')
    posisiTerakhirRef.current = null

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const sebelumnya = posisiTerakhirRef.current

        if (sebelumnya) {
          const jarak = jarakMeter(sebelumnya.lat, sebelumnya.lng, lat, lng)
          if (jarak < JARAK_MINIMUM_METER) return
        }

        posisiTerakhirRef.current = { lat, lng }
        set(LOKASI_REF, {
          lat,
          lng,
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
    kirimNotifikasi('penumpang', 'Ahyan otw! 🕸️', 'Live location udah nyala, cek lokasinya di peta.', 'live-lokasi')
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
    remove(LOKASI_REF)

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { aktif, error, mulai, berhenti }
}