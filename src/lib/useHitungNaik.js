import { useEffect, useState } from 'react'

// Angka naik bertahap dari 0 ke target, patah-patah kayak skor di game.
// Kalau HP-nya minta animasi dikurangi, angkanya langsung tampil.
export function useHitungNaik(target, durasi = 500, langkah = 10) {
  const [nilai, setNilai] = useState(0)

  useEffect(() => {
    const kurangiGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (kurangiGerak || target === 0) {
      setNilai(target)
      return
    }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setNilai(Math.round((target * i) / langkah))
      if (i >= langkah) clearInterval(id)
    }, durasi / langkah)
    return () => clearInterval(id)
  }, [target, durasi, langkah])

  return nilai
}
