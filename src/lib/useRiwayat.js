import { useEffect, useMemo, useState } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import { STATUS_BAYAR } from './constants'
import { firestoreId } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'

export function useRiwayat() {
  const { user, isDemo } = useAuth()
  const [riwayat, setRiwayat] = useState([])
  const [siap, setSiap] = useState(false)
  const namaKoleksi = firestoreId('riwayat', isDemo)
  const REF = useMemo(() => collection(db, namaKoleksi), [namaKoleksi])

  useEffect(() => {
    if (!user) return

    const q = query(REF, orderBy('dibuatPada', 'desc'))
    const berhentiDengar = onSnapshot(q, (snap) => {
      setRiwayat(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setSiap(true)
    })
    return berhentiDengar
  }, [user, REF])

  async function tambahRiwayat(data) {
    await addDoc(REF, { ...data, dibuatPada: Date.now() })
  }

  async function tandaiLunas(id) {
    await updateDoc(doc(db, namaKoleksi, id), { statusBayar: STATUS_BAYAR.LUNAS })
  }

  async function hapusRiwayat(id) {
    await deleteDoc(doc(db, namaKoleksi, id))
  }

  async function editRiwayat(id, data) {
    await updateDoc(doc(db, namaKoleksi, id), data)
  }

  return { riwayat, siap, tambahRiwayat, tandaiLunas, hapusRiwayat, editRiwayat }
}