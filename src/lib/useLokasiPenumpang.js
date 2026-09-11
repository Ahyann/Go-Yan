import { useEffect, useMemo, useState } from 'react'
import { ref, onValue, remove } from 'firebase/database'
import { rtdb } from './firebase'
import { rtdbPath } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'

export function useLokasiPenumpang() {
  const { user, isDemo } = useAuth()
  const [lokasi, setLokasi] = useState(null)
  const LOKASI_REF = useMemo(
    () => ref(rtdb, rtdbPath('lokasi/penumpang', isDemo, user?.uid)),
    [isDemo, user?.uid]
  )

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onValue(LOKASI_REF, (snap) => {
      setLokasi(snap.exists() ? snap.val() : null)
    })
    return berhentiDengar
  }, [user, LOKASI_REF])

  return lokasi
}

export async function hapusLokasiPenumpangSekarang(isDemo, uid) {
  await remove(ref(rtdb, rtdbPath('lokasi/penumpang', isDemo, uid)))
}