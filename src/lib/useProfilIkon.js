import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { firestoreId } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'

// Beda dari fitur upload foto (yang kita batalin) — ini cuma nyimpen
// NAMA FILE icon yang dipilih (dari daftar preset yang udah ada di
// public/icons/), BUKAN data gambar. Jauh lebih ringan & simpel,
// gak butuh kompres apa pun.
const DEFAULT_IKON_AHYAN = 'spidericon.png'
const DEFAULT_IKON_FAJRI = 'fajri.png'

export function useProfilIkon() {
  const { user, isDemo } = useAuth()
  const [ikonAhyan, setIkonAhyan] = useState(DEFAULT_IKON_AHYAN)
  const [ikonFajri, setIkonFajri] = useState(DEFAULT_IKON_FAJRI)
  const REF = useMemo(
    () => doc(db, 'state', firestoreId('profilIkon', isDemo, user?.uid)),
    [isDemo, user?.uid]
  )

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onSnapshot(REF, (snap) => {
      if (!snap.exists()) return
      if (snap.data().ahyan) setIkonAhyan(snap.data().ahyan)
      if (snap.data().fajri) setIkonFajri(snap.data().fajri)
    })
    return berhentiDengar
  }, [user, REF])

  async function pilihIkonAhyan(namaFile) {
    await setDoc(REF, { ahyan: namaFile }, { merge: true })
  }

  async function pilihIkonFajri(namaFile) {
    await setDoc(REF, { fajri: namaFile }, { merge: true })
  }

  return { ikonAhyan, pilihIkonAhyan, ikonFajri, pilihIkonFajri }
}
