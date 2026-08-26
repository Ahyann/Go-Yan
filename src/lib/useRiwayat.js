import { useEffect, useState } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import { STATUS_BAYAR } from './constants'
import { useAuth } from '../context/AuthContext.jsx'

const REF = collection(db, 'riwayat')

export function useRiwayat() {
  const { user } = useAuth()
  const [riwayat, setRiwayat] = useState([])
  const [siap, setSiap] = useState(false)

  useEffect(() => {
    if (!user) return

    const q = query(REF, orderBy('dibuatPada', 'desc'))
    const berhentiDengar = onSnapshot(q, (snap) => {
      setRiwayat(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setSiap(true)
    })
    return berhentiDengar
  }, [user])

  async function tambahRiwayat(data) {
    await addDoc(REF, { ...data, dibuatPada: Date.now() })
  }

  async function tandaiLunas(id) {
    await updateDoc(doc(db, 'riwayat', id), { statusBayar: STATUS_BAYAR.LUNAS })
  }

  async function hapusRiwayat(id) {
    await deleteDoc(doc(db, 'riwayat', id))
  }

  async function editRiwayat(id, data) {
    await updateDoc(doc(db, 'riwayat', id), data)
  }

  return { riwayat, siap, tambahRiwayat, tandaiLunas, hapusRiwayat, editRiwayat }
}