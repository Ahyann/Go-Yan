import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import { STATUS_PERMINTAAN } from './constants'
import { kirimNotifikasi } from './notifikasi'
import { useAuth } from '../context/AuthContext.jsx'

const REF = doc(db, 'state', 'permintaanAktif')

export function usePermintaanAktif() {
  const { user } = useAuth()
  const [permintaan, setPermintaan] = useState(undefined)

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onSnapshot(REF, (snap) => {
      setPermintaan(snap.exists() ? snap.data() : null)
    })
    return berhentiDengar
  }, [user])

  async function kirimGo({ aksi, where, waktu }) {
    await setDoc(REF, {
      aksi,
      where,
      waktu,
      status: STATUS_PERMINTAAN.MENUNGGU,
      dibuatPada: Date.now(),
    })
    kirimNotifikasi(
      'ojek',
      'Pesenan baru! 🕸️',
      `Fajri mau ${aksi === 'jemput' ? 'dijemput' : 'diantar'} · ${where} · ${waktu}`,
      'pesenan'
    )
  }

  async function terima() {
    await updateDoc(REF, { status: STATUS_PERMINTAAN.DITERIMA })
    if (permintaan) {
      kirimNotifikasi(
        'penumpang',
        'Ahyan Menerima! ✅',
        `${permintaan.aksi === 'jemput' ? 'Jemput' : 'Antar'} · ${permintaan.where} · ${permintaan.waktu}`,
        'diterima'
      )
    }
  }

  async function tolak() {
    await updateDoc(REF, { status: STATUS_PERMINTAAN.DITOLAK })
  }

  async function selesai() {
    await deleteDoc(REF)
  }

  async function batal() {
    await deleteDoc(REF)
  }

  return { permintaan, kirimGo, terima, tolak, selesai, batal }
}