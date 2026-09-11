import { useEffect, useMemo, useState } from 'react'
import { ref, set, remove, onValue } from 'firebase/database'
import { rtdb } from './firebase'
import { kirimNotifikasi } from './notifikasi'
import { rtdbPath } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'

export function usePesanPenumpang() {
  const { user, isDemo } = useAuth()
  const [pesan, setPesan] = useState(null)
  const [siap, setSiap] = useState(false)
  const PESAN_REF = useMemo(() => ref(rtdb, rtdbPath('pesan/penumpang', isDemo)), [isDemo])

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onValue(PESAN_REF, (snap) => {
      setPesan(snap.exists() ? snap.val() : null)
      setSiap(true)
    })
    return berhentiDengar
  }, [user, PESAN_REF])

  async function kirimPesan(teks) {
    if (!teks.trim()) return
    await set(PESAN_REF, { teks: teks.trim(), dibuatPada: Date.now() })
    if (!isDemo) kirimNotifikasi('ojek', 'Pesan dari Fajri 💬', teks.trim(), 'pesan')
  }

  async function hapusPesan() {
    await remove(PESAN_REF)
  }

  return { pesan, siap, kirimPesan, hapusPesan }
}
