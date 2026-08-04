import { useEffect, useState } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import { STATUS_BAYAR } from './constants'

const REF = collection(db, 'riwayat')

export function useRiwayat() {
  const [riwayat, setRiwayat] = useState([])

  useEffect(() => {
    // orderBy 'dibuatPada' desc: yang paling baru muncul duluan di list.
    const q = query(REF, orderBy('dibuatPada', 'desc'))
    const berhentiDengar = onSnapshot(q, (snap) => {
      setRiwayat(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return berhentiDengar
  }, [])

  async function tambahRiwayat(data) {
    await addDoc(REF, { ...data, dibuatPada: Date.now() })
  }

  async function tandaiLunas(id) {
    await updateDoc(doc(db, 'riwayat', id), { statusBayar: STATUS_BAYAR.LUNAS })
  }

  async function hapusRiwayat(id) {
    await deleteDoc(doc(db, 'riwayat', id))
  }

  return { riwayat, tambahRiwayat, tandaiLunas, hapusRiwayat }
}