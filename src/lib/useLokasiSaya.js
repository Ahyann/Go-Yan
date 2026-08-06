import { useEffect, useRef, useState } from 'react'
import { ref, set, remove } from 'firebase/database'
import { rtdb } from './firebase'
import { kirimNotifikasi } from './notifikasi'

// Satu node tetap — cuma ada 1 ojek, jadi gak perlu banyak path.
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

    // watchPosition beda sama getCurrentPosition — dia bukan ambil
    // sekali doang, tapi TERUS manggil callback ini tiap posisi
    // berubah, selama belum di-clearWatch.
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
    kirimNotifikasi('penumpang', 'Ahyan otw! 🕸️', 'Live location udah nyala, cek lokasinya di peta.', 'live-lokasi')
  }

  function berhenti() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setAktif(false)
    remove(LOKASI_REF) // bersihin data lama biar gak nyangkut nunjuk posisi terakhir selamanya
  }

  useEffect(() => {
    // Kalau app di-reload/dibuka ulang (misal abis "dimatiin"/di-suspend
    // lama sama iOS pas ditinggal), status lokal (aktif) balik ke awal,
    // tapi data lokasi lama di server BELUM tentu ikut kehapus — bikin
    // Fajri masih liat status "live" padahal GPS-nya udah gak jalan.
    // Bersihin proaktif begitu komponen ini baru mulai, biar konsisten.
    remove(LOKASI_REF)

    // Jaga-jaga: kalau halaman ditutup/pindah selagi masih aktif,
    // matiin watch-nya juga, jangan biarin jalan di belakang selamanya.
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { aktif, error, mulai, berhenti }
}
