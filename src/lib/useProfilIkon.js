import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from '../context/AuthContext.jsx'

const REF = doc(db, 'state', 'profilIkon')

// Beda dari fitur upload foto (yang kita batalin) — ini cuma nyimpen
// NAMA FILE icon yang dipilih (dari daftar preset yang udah ada di
// public/icons/), BUKAN data gambar. Jauh lebih ringan & simpel,
// gak butuh kompres apa pun.
const DEFAULT_IKON_AHYAN = 'spidericon.png'

export function useProfilIkon() {
  const { user } = useAuth()
  const [ikonAhyan, setIkonAhyan] = useState(DEFAULT_IKON_AHYAN)

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onSnapshot(REF, (snap) => {
      if (snap.exists() && snap.data().ahyan) {
        setIkonAhyan(snap.data().ahyan)
      }
    })
    return berhentiDengar
  }, [user])

  async function pilihIkonAhyan(namaFile) {
    await setDoc(REF, { ahyan: namaFile }, { merge: true })
  }

  return { ikonAhyan, pilihIkonAhyan }
}
