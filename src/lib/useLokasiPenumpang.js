import { useEffect, useState } from 'react'
import { ref, onValue, remove } from 'firebase/database'
import { rtdb } from './firebase'
import { useAuth } from '../context/AuthContext.jsx'

const LOKASI_REF = ref(rtdb, 'lokasi/penumpang')

export function useLokasiPenumpang() {
  const { user } = useAuth()
  const [lokasi, setLokasi] = useState(null)

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onValue(LOKASI_REF, (snap) => {
      setLokasi(snap.exists() ? snap.val() : null)
    })
    return berhentiDengar
  }, [user])

  return lokasi
}

export async function hapusLokasiPenumpangSekarang() {
  await remove(LOKASI_REF)
}