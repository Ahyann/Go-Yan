import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_WARNA_GLOW } from './warnaGlow'
import { useAuth } from '../context/AuthContext.jsx'

const REF = doc(db, 'state', 'profilWarna')

export function useWarnaGlow() {
  const { user } = useAuth()
  const [warnaAhyan, setWarnaAhyan] = useState(DEFAULT_WARNA_GLOW)
  const [warnaFajri, setWarnaFajri] = useState(DEFAULT_WARNA_GLOW)

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onSnapshot(REF, (snap) => {
      if (!snap.exists()) return
      if (snap.data().ahyan) setWarnaAhyan(snap.data().ahyan)
      if (snap.data().fajri) setWarnaFajri(snap.data().fajri)
    })
    return berhentiDengar
  }, [user])

  async function pilihWarnaAhyan(namaWarna) {
    await setDoc(REF, { ahyan: namaWarna }, { merge: true })
  }

  async function pilihWarnaFajri(namaWarna) {
    await setDoc(REF, { fajri: namaWarna }, { merge: true })
  }

  return { warnaAhyan, pilihWarnaAhyan, warnaFajri, pilihWarnaFajri }
}