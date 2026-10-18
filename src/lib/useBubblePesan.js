import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Ngurus bubble chat di marker peta. Satu pesan di database = satu bubble.
//
// Pesan CUMA dihapus kalau user nutup bubble-nya sendiri (lewat tutup()).
// Kalau popup tertutup sendiri sementara pesan masih aktif (Leaflet bisa
// nutup popup pas marker/ikon di-update, peta di-resize, dst), itu bukan
// permintaan user: pesannya dibiarin dan bubble-nya dibuka lagi. Dulu
// popupclose langsung dianggap "user nutup" dan menghapus pesan, jadinya
// chat baru bisa ilang sepersekian detik setelah muncul.
//
// Pakai: ref={bubble.refMarker} eventHandlers={bubble.eventHandlers} di
// <Marker>, dan onTutup={bubble.tutup} di isi bubble-nya.
export function useBubblePesan(pesan, hapusPesan) {
  const markerRef = useRef(null)
  const [marker, setMarker] = useState(null)
  const pesanAktifRef = useRef(null)
  const hapusRef = useRef(hapusPesan)
  const bukaUlangPadaRef = useRef(0)

  // Diset saat render (bukan di effect) supaya closePopup() di effect bawah
  // sudah lihat "gak ada pesan aktif" dan gak dianggap penutupan paksa.
  pesanAktifRef.current = pesan
  hapusRef.current = hapusPesan

  const refMarker = useCallback((instance) => {
    markerRef.current = instance
    setMarker(instance)
  }, [])

  const adaPesan = Boolean(pesan)
  const dibuatPada = pesan?.dibuatPada

  // Pesan baru (atau ganti isi) -> buka bubble & hitung ulang ukurannya,
  // karena isi popup bisa beda ukuran (teks vs foto). Pesan hilang -> tutup.
  useEffect(() => {
    if (!marker) return
    if (!adaPesan) {
      marker.closePopup()
      return
    }
    const id = setTimeout(() => {
      marker.getPopup()?.update()
      marker.openPopup()
    }, 0)
    return () => clearTimeout(id)
  }, [marker, adaPesan, dibuatPada])

  const eventHandlers = useMemo(
    () => ({
      popupclose: () => {
        if (!pesanAktifRef.current) return
        // Jangan buka-tutup terus kalau ada yang nutup berulang.
        const sekarang = Date.now()
        if (sekarang - bukaUlangPadaRef.current < 400) return
        bukaUlangPadaRef.current = sekarang
        setTimeout(() => {
          if (pesanAktifRef.current) markerRef.current?.openPopup()
        }, 0)
      },
    }),
    []
  )

  const tutup = useCallback(() => {
    pesanAktifRef.current = null
    hapusRef.current()
    markerRef.current?.closePopup()
  }, [])

  return { marker, refMarker, eventHandlers, tutup }
}
