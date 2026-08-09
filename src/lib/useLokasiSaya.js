import { useEffect, useRef, useState } from 'react'
import { ref, set, update } from 'firebase/database'
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
    // Begitu app dibuka/di-reload ulang, status TOMBOL lokal balik ke
    // "mati" otomatis (dari useState di atas). Di sini kita cuma
    // nandain ke SERVER kalau live-nya emang beneran udah berhenti
    // (biar orang lain gak keliru liat status "live" padahal GPS-nya
    // udah gak jalan) — TAPI posisi terakhir & chat yang nempel di
    // situ SENGAJA gak ikut kehapus, biar icon-nya tetep keliatan di
    // lokasi terakhir dia.
    update(LOKASI_REF, { aktif: false }).catch(() => {})

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { aktif, error, mulai, berhenti }
}
