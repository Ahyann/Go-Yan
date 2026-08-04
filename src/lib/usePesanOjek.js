import { useEffect, useState } from 'react'
import { ref, set, remove, onValue } from 'firebase/database'
import { rtdb } from './firebase'

const PESAN_REF = ref(rtdb, 'pesan/ojek')

export function usePesanOjek() {
  const [pesan, setPesan] = useState(null)

  useEffect(() => {
    const berhentiDengar = onValue(PESAN_REF, (snap) => {
      setPesan(snap.exists() ? snap.val() : null)
    })
    return berhentiDengar
  }, [])

  async function kirimPesan(teks) {
    if (!teks.trim()) return
    await set(PESAN_REF, { teks: teks.trim(), dibuatPada: Date.now() })
  }

  async function hapusPesan() {
    await remove(PESAN_REF)
  }

  return { pesan, kirimPesan, hapusPesan }
}