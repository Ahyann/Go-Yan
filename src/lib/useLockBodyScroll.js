import { useEffect } from 'react'

// Dipanggil di dalem komponen popup — selama komponen itu ke-render,
// scroll di background (halaman di belakang popup) DIKUNCI, gak bisa
// digeser/discroll walau jarinya nyentuh area di luar popup. Begitu
// popup-nya ditutup (komponen unmount), scroll balik normal lagi.
export function useLockBodyScroll() {
  useEffect(() => {
    const overflowSebelumnya = document.body.style.overflow
    const posisiSebelumnya = document.body.style.position
    const scrollYSebelumnya = window.scrollY

    document.body.style.overflow = 'hidden'
    // position:fixed di body itu yang bener-bener nge-block gesture
    // scroll di iOS Safari — cuma overflow:hidden doang kadang masih
    // "bocor" di beberapa versi iOS.
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollYSebelumnya}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = overflowSebelumnya
      document.body.style.position = posisiSebelumnya
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollYSebelumnya)
    }
  }, [])
}
