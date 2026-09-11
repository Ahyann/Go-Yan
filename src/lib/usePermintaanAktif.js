import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import { STATUS_PERMINTAAN } from './constants'
import { kirimNotifikasi } from './notifikasi'
import { firestoreId } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'

export function usePermintaanAktif() {
  const { user, isDemo } = useAuth()
  const [permintaan, setPermintaan] = useState(undefined)
  const REF = useMemo(
    () => doc(db, 'state', firestoreId('permintaanAktif', isDemo, user?.uid)),
    [isDemo, user?.uid]
  )

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onSnapshot(REF, (snap) => {
      setPermintaan(snap.exists() ? snap.data() : null)
    })
    return berhentiDengar
  }, [user, REF])

  async function kirimGo({ aksi, where, waktu }) {
    await setDoc(REF, {
      aksi,
      where,
      waktu,
      status: STATUS_PERMINTAAN.MENUNGGU,
      dibuatPada: Date.now(),
    })
    if (!isDemo) {
      kirimNotifikasi(
        'ojek',
        'Pesenan baru! 🕸️',
        `Fajri mau ${aksi === 'jemput' ? 'dijemput' : 'diantar'} · ${where} · ${waktu}`,
        'pesenan'
      )
    }
  }

  async function terima() {
    await updateDoc(REF, { status: STATUS_PERMINTAAN.DITERIMA })
    if (permintaan && !isDemo) {
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