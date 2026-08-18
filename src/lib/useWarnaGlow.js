import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_WARNA_GLOW } from './warnaGlow'

const REF = doc(db, 'state', 'profilWarna')

export function useWarnaGlow() {
  const [warnaAhyan, setWarnaAhyan] = useState(DEFAULT_WARNA_GLOW)

  useEffect(() => {
    const berhentiDengar = onSnapshot(REF, (snap) => {
      if (snap.exists() && snap.data().ahyan) {
        setWarnaAhyan(snap.data().ahyan)
      }
    })
    return berhentiDengar
  }, [])

  async function pilihWarnaAhyan(namaWarna) {
    await setDoc(REF, { ahyan: namaWarna }, { merge: true })
  }

  return { warnaAhyan, pilihWarnaAhyan }
}