import { useEffect } from 'react'

// Dipanggil di dalam komponen popup: selama popup tampil, halaman di belakangnya tidak bisa discroll.
// Sengaja TIDAK memakai position:fixed di body. Di iPhone itu mengubah ukuran area halaman, jadi bagian bawah
// layar terpotong dan menyisakan area kosong. Cukup overflow:hidden di html dan body; layar app memang tidak
// discroll di level body (peta dan daftar punya scroll sendiri).
export function useLockBodyScroll() {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const htmlSebelumnya = html.style.overflow
    const bodySebelumnya = body.style.overflow

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    return () => {
      html.style.overflow = htmlSebelumnya
      body.style.overflow = bodySebelumnya
    }
  }, [])
}
