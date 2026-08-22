import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_WARNA_GLOW } from './warnaGlow'
import { useAuth } from '../context/AuthContext.jsx'

const REF = doc(db, 'state', 'profilWarna')

export function useWarnaGlow() {
  const { user } = useAuth()
  const [warnaAhyan, setWarnaAhyan] = useState(DEFAULT_WARNA_GLOW)

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onSnapshot(REF, (snap) => {
      if (snap.exists() && snap.data().ahyan) {
        setWarnaAhyan(snap.data().ahyan)
      }
    })
    return berhentiDengar
  }, [user])

  async function pilihWarnaAhyan(namaWarna) {
    await setDoc(REF, { ahyan: namaWarna }, { merge: true })
  }

  return { warnaAhyan, pilihWarnaAhyan }
}