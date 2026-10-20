import { useEffect, useRef } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

// Batas waktu nunggu lokasi pertama setelah tombol live location dipencet.
const BATAS_TUNGGU_MS = 30000
const ZOOM_MINIMUM = 16

// Begitu user baru menyalakan live location, pindahkan peta ke karakternya
// sendiri, SEKALI SAJA, begitu lokasi pertamanya masuk.
//
// - sinyal: angka yang nambah tiap kali tombol "nyalakan" dipencet. Cuma ini
//   yang bikin peta pindah, jadi lokasi yang masuk dengan sendirinya (misal
//   sisa dari sesi lama, atau update GPS berikutnya) gak pernah narik peta.
// - posisi: [lat, lng] karakter sendiri (null kalau belum ada). Harus
//   referensi stabil (useMemo) supaya cuma berubah kalau koordinatnya berubah.
// Kalau user keburu geser/zoom peta sendiri sebelum lokasi pertama masuk,
// pemindahan dibatalkan (peta jangan direbut dari tangan user).
export default function PusatkanKeSaya({ sinyal, posisi }) {
  const map = useMap()
  const menungguSejakRef = useRef(0)
  // Nilai sinyal saat komponen ini dipasang. Cuma PERUBAHAN setelah itu yang dihitung,
  // jadi balik ke tab Home (komponen dipasang ulang) pas live lagi nyala gak narik peta.
  const sinyalTerakhirRef = useRef(sinyal)

  useMapEvents({
    dragstart: () => { menungguSejakRef.current = 0 },
    zoomstart: () => { menungguSejakRef.current = 0 },
  })

  useEffect(() => {
    if (sinyal === sinyalTerakhirRef.current) return
    sinyalTerakhirRef.current = sinyal
    menungguSejakRef.current = Date.now()
  }, [sinyal])

  useEffect(() => {
    if (!posisi || !menungguSejakRef.current) return
    const menunggu = Date.now() - menungguSejakRef.current
    menungguSejakRef.current = 0 // sekali saja
    if (menunggu > BATAS_TUNGGU_MS) return
    map.setView(posisi, Math.max(map.getZoom(), ZOOM_MINIMUM))
  }, [posisi, map])

  return null
}
