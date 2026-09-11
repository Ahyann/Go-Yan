import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { firestoreId } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'

const KOSONG = {
  senin: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
  selasa: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
  rabu: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
  kamis: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
  jumat: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
}

function formatTanggalLokal(d) {
  const tahun = d.getFullYear()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const tanggal = String(d.getDate()).padStart(2, '0')
  return `${tahun}-${bulan}-${tanggal}`
}

export function kodeMingguIni() {
  const d = new Date()
  const hari = d.getDay()

  const mundurHari = (hari - 6 + 7) % 7

  const referensi = new Date(d)
  referensi.setDate(d.getDate() - mundurHari)
  referensi.setHours(12, 0, 0, 0)

  if (referensi > d) {
    referensi.setDate(referensi.getDate() - 7)
  }

  return formatTanggalLokal(referensi)
}

export function useJadwalMingguan() {
  const { user, isDemo } = useAuth()
  const [jadwal, setJadwal] = useState(undefined)
  const REF = useMemo(() => doc(db, 'state', firestoreId('jadwalMingguan', isDemo)), [isDemo])

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onSnapshot(REF, (snap) => {
      const mingguSekarang = kodeMingguIni()

      if (!snap.exists()) {
        setJadwal({ ...KOSONG, kodeMinggu: mingguSekarang })
        return
      }

      const data = snap.data()
      if (data.kodeMinggu !== mingguSekarang) {
        setJadwal({ ...KOSONG, kodeMinggu: mingguSekarang })
        return
      }

      setJadwal({ ...KOSONG, ...data })
    })
    return berhentiDengar
  }, [user, REF])

  async function simpanJadwal(dataBaru) {
    await setDoc(REF, { ...dataBaru, kodeMinggu: kodeMingguIni() })
  }

  async function tandaiSelesai(hari, nilaiBaru) {
    await setDoc(REF, { [hari]: { selesai: nilaiBaru } }, { merge: true })
  }

  return { jadwal, simpanJadwal, tandaiSelesai }
}