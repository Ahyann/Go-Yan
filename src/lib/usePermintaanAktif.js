import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { ref as rtdbRef, remove as rtdbRemove } from 'firebase/database'
import { db, rtdb } from './firebase'
import { STATUS_PERMINTAAN } from './constants'
import { kirimNotifikasi } from './notifikasi'
import { firestoreId, rtdbPath } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'

// Chat bubble di peta cuma kehapus kalau popup-nya ditutup manual, jadi
// kalau perjalanan keburu selesai/batal sebelum popup ditutup, chat lama
// nyangkut dan muncul lagi di order berikutnya. Makanya dibersihin
// paksa di tiap awal & akhir order.
function bersihkanSemuaPesan(isDemo) {
  return Promise.all([
    rtdbRemove(rtdbRef(rtdb, rtdbPath('pesan/ojek', isDemo))),
    rtdbRemove(rtdbRef(rtdb, rtdbPath('pesan/penumpang', isDemo))),
  ]).catch(() => {})
}

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

  // Badge "ditolak" otomatis ilang 5 detik setelah ditolak — itungan
  // waktunya nempel di data (ditolakPada), bukan timer lokal doang,
  // jadi kalau app-nya sempet ketutup terus dibuka lagi di tengah
  // jalan, sisa waktunya tetep bener (bukan mulai ulang dari 5 detik).
  useEffect(() => {
    if (permintaan?.status !== STATUS_PERMINTAAN.DITOLAK) return

    // Data lama (dari sebelum fitur ini ada) gak punya ditolakPada —
    // anggap aja udah kadaluarsa daripada nyangkut selamanya.
    const sisaWaktu = permintaan.ditolakPada ? 5000 - (Date.now() - permintaan.ditolakPada) : 0
    if (sisaWaktu <= 0) {
      deleteDoc(REF).catch(() => {})
      return
    }

    const id = setTimeout(() => {
      deleteDoc(REF).catch(() => {})
    }, sisaWaktu)
    return () => clearTimeout(id)
  }, [permintaan, REF])

  async function kirimGo({ aksi, where, waktu }) {
    await bersihkanSemuaPesan(isDemo)
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
    await updateDoc(REF, { status: STATUS_PERMINTAAN.DITOLAK, ditolakPada: Date.now() })
  }

  async function selesai() {
    await deleteDoc(REF)
    await bersihkanSemuaPesan(isDemo)
  }

  async function batal() {
    await deleteDoc(REF)
    await bersihkanSemuaPesan(isDemo)
  }

  return { permintaan, kirimGo, terima, tolak, selesai, batal }
}