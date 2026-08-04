import { useEffect, useState } from 'react'
import { ref, onValue, remove } from 'firebase/database'
import { rtdb } from './firebase'

const LOKASI_REF = ref(rtdb, 'lokasi/penumpang')

export function useLokasiPenumpang() {
  const [lokasi, setLokasi] = useState(null)

  useEffect(() => {
    const berhentiDengar = onValue(LOKASI_REF, (snap) => {
      setLokasi(snap.exists() ? snap.val() : null)
    })
    return berhentiDengar
  }, [])

  return lokasi
}

export async function hapusLokasiPenumpangSekarang() {
  await remove(LOKASI_REF)
}