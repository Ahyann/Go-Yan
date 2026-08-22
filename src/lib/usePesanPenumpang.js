import { useEffect, useState } from 'react'
import { ref, set, remove, onValue } from 'firebase/database'
import { rtdb } from './firebase'
import { kirimNotifikasi } from './notifikasi'
import { useAuth } from '../context/AuthContext.jsx'

const PESAN_REF = ref(rtdb, 'pesan/penumpang')

export function usePesanPenumpang() {
  const { user } = useAuth()
  const [pesan, setPesan] = useState(null)
  const [siap, setSiap] = useState(false)

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onValue(PESAN_REF, (snap) => {
      setPesan(snap.exists() ? snap.val() : null)
      setSiap(true)
    })
    return berhentiDengar
  }, [user])

  async function kirimPesan(teks) {
    if (!teks.trim()) return
    await set(PESAN_REF, { teks: teks.trim(), dibuatPada: Date.now() })
    kirimNotifikasi('ojek', 'Pesan dari Fajri 💬', teks.trim(), 'pesan')
  }

  async function hapusPesan() {
    await remove(PESAN_REF)
  }

  return { pesan, siap, kirimPesan, hapusPesan }
}
