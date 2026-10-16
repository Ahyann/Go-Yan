import { useEffect, useRef, useState } from 'react'
import RodaPesan, { indeksDariArah } from './RodaPesan.jsx'

const DURASI_TAHAN = 250

// Pasang gestur "tahan karakter di peta" ke elemen marker Leaflet: tahan,
// roda pesan cepat muncul ke kiri, arahin jari ke pesan, lepas buat kirim.
// Tap biasa tetap diurus Leaflet (buka bubble pesan).
//
// Props:
// - marker: instance L.Marker (dari ref), `siap` berubah saat instance ada
// - ikon: ikon marker, supaya listener dipasang ulang kalau elemennya ganti
export default function QuickChatMarker({ marker, siap, ikon, aktif, onKirim, pesanCepat }) {
  const [menu, setMenu] = useState(null)
  const [terpilih, setTerpilih] = useState(null)
  const aktifRef = useRef(aktif)
  const kirimRef = useRef(onKirim)
  const pesanRef = useRef(pesanCepat)

  useEffect(() => {
    aktifRef.current = aktif
    kirimRef.current = onKirim
    pesanRef.current = pesanCepat
  })

  useEffect(() => {
    const el = marker?.getElement()
    if (!el) return

    let timer = null
    let pusat = null
    let idx = null
    let pointerId = null
    let wheelTerbuka = false

    el.style.touchAction = 'none'
    el.style.userSelect = 'none'
    el.style.webkitUserSelect = 'none'
    el.style.webkitTouchCallout = 'none'

    function tutup() {
      clearTimeout(timer)
      pusat = null
      idx = null
      pointerId = null
      setTerpilih(null)
      setMenu(null)
    }

    function kirim(teks) {
      Promise.resolve(kirimRef.current(teks)).catch((err) => {
        console.error('Gagal kirim pesan cepat:', err)
        alert('Gagal kirim pesan: ' + err.message)
      })
    }

    function onDown(e) {
      if (!aktifRef.current) return
      // Cegah peta ikut kegeser selama marker ditahan.
      e.stopPropagation()
      wheelTerbuka = false
      pointerId = e.pointerId
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        // pointer sudah lepas atau bukan pointer asli, gestur tetap jalan
      }
      clearTimeout(timer)
      timer = setTimeout(() => {
        const r = el.getBoundingClientRect()
        pusat = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        wheelTerbuka = true
        navigator.vibrate?.(12)
        setMenu({ pusat })
      }, DURASI_TAHAN)
    }

    function onMove(e) {
      if (!pusat || e.pointerId !== pointerId) return
      const baru = indeksDariArah(pusat, e.clientX, e.clientY, pesanRef.current.length)
      if (baru !== idx) {
        idx = baru
        setTerpilih(baru)
        if (baru !== null) navigator.vibrate?.(8)
      }
    }

    function onUp() {
      if (pusat && idx !== null) kirim(pesanRef.current[idx])
      tutup()
    }

    // Lepas setelah roda kebuka jangan dianggap klik (bukain bubble marker).
    function onClick(e) {
      if (wheelTerbuka) {
        e.stopPropagation()
        e.preventDefault()
        wheelTerbuka = false
      }
    }

    const stop = (e) => aktifRef.current && e.stopPropagation()
    // Di PC, gambar karakter bisa ke-drag browser (jadi hantu gambar) dan
    // ngegagalin gestur, jadi drag bawaannya dimatiin.
    const cegahMenu = (e) => e.preventDefault()

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', tutup)
    el.addEventListener('click', onClick, true)
    el.addEventListener('contextmenu', cegahMenu)
    el.addEventListener('dragstart', cegahMenu)
    el.addEventListener('mousedown', stop)
    el.addEventListener('touchstart', stop, { passive: true })

    return () => {
      clearTimeout(timer)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', tutup)
      el.removeEventListener('click', onClick, true)
      el.removeEventListener('contextmenu', cegahMenu)
      el.removeEventListener('dragstart', cegahMenu)
      el.removeEventListener('mousedown', stop)
      el.removeEventListener('touchstart', stop)
    }
  }, [marker, siap, ikon])

  if (!menu) return null
  return <RodaPesan pusat={menu.pusat} terpilih={terpilih} pesanCepat={pesanCepat} />
}
