import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import { STATUS_PERMINTAAN } from './constants'

const REF = doc(db, 'state', 'permintaanAktif')

export function usePermintaanAktif() {
  const [permintaan, setPermintaan] = useState(undefined)

  useEffect(() => {
    const berhentiDengar = onSnapshot(REF, (snap) => {
      setPermintaan(snap.exists() ? snap.data() : null)
    })
    return berhentiDengar
  }, [])

  async function kirimGo({ aksi, where, waktu }) {
    await setDoc(REF, {
      aksi,
      where,
      waktu,
      status: STATUS_PERMINTAAN.MENUNGGU,
      dibuatPada: Date.now(),
    })
  }

  async function terima() {
    await updateDoc(REF, { status: STATUS_PERMINTAAN.DITERIMA })
  }

  async function tolak() {
    await updateDoc(REF, { status: STATUS_PERMINTAAN.DITOLAK })
  }

  async function selesai() {
    await deleteDoc(REF)
  }

  return { permintaan, kirimGo, terima, tolak, selesai }
}