import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_WARNA_GLOW } from './warnaGlow'
import { firestoreId } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'

export function useWarnaGlow() {
  const { user, isDemo } = useAuth()
  const [warnaAhyan, setWarnaAhyan] = useState(DEFAULT_WARNA_GLOW)
  const [warnaFajri, setWarnaFajri] = useState(DEFAULT_WARNA_GLOW)
  const REF = useMemo(
    () => doc(db, 'state', firestoreId('profilWarna', isDemo, user?.uid)),
    [isDemo, user?.uid]
  )

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onSnapshot(REF, (snap) => {
      if (!snap.exists()) return
      if (snap.data().ahyan) setWarnaAhyan(snap.data().ahyan)
      if (snap.data().fajri) setWarnaFajri(snap.data().fajri)
    })
    return berhentiDengar
  }, [user, REF])

  async function pilihWarnaAhyan(namaWarna) {
    await setDoc(REF, { ahyan: namaWarna }, { merge: true })
  }

  async function pilihWarnaFajri(namaWarna) {
    await setDoc(REF, { fajri: namaWarna }, { merge: true })
  }

  return { warnaAhyan, pilihWarnaAhyan, warnaFajri, pilihWarnaFajri }
}