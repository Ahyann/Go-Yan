import { useEffect, useRef, useState } from 'react'
import { ref, set, update, get } from 'firebase/database'
import { rtdb } from './firebase'
import { kirimNotifikasi } from './notifikasi'

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
    kirimNotifikasi('penumpang', 'Ahyan otw! 🕸️', 'Live location udah nyala, cek lokasinya di peta.', 'live-lokasi')
  }

  function berhenti() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setAktif(false)
    // Posisi TERAKHIR sengaja gak dihapus (icon & chat yang nempel di
    // situ tetep keliatan) — cuma ditandain "udah gak live lagi".
    update(LOKASI_REF, { aktif: false }).catch(() => {})
  }

  useEffect(() => {
    // PENTING: cek dulu apa datanya UDAH ADA sebelum nulis "aktif:
    // false" — kalau langsung update() tanpa ngecek dan datanya belum
    // pernah ada sama sekali, itu bakal BIKIN data baru yang cuma
    // punya field aktif doang (tanpa lat/lng) — data "hantu" ini yang
    // bikin peta crash pas nyoba render marker dari koordinat kosong.
    get(LOKASI_REF)
      .then((snap) => {
        if (snap.exists()) {
          update(LOKASI_REF, { aktif: false }).catch(() => {})
        }
      })
      .catch(() => {})

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { aktif, error, mulai, berhenti }
}
