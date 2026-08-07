import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const REF = doc(db, 'state', 'jadwalMingguan')

const KOSONG = {
  senin: { antar: '', jemput: '' },
  selasa: { antar: '', jemput: '' },
  rabu: { antar: '', jemput: '' },
  kamis: { antar: '', jemput: '' },
  jumat: { antar: '', jemput: '' },
}

function formatTanggalLokal(d) {
  const tahun = d.getFullYear()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const tanggal = String(d.getDate()).padStart(2, '0')
  return `${tahun}-${bulan}-${tanggal}`
}

function kodeMingguIni() {
  const d = new Date()
  const hari = d.getDay()
  const mundur = hari === 0 ? 6 : hari - 1
  d.setDate(d.getDate() - mundur)
  return formatTanggalLokal(d)
}

export function useJadwalMingguan() {
  const [jadwal, setJadwal] = useState(undefined)

  useEffect(() => {
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
  }, [])

  async function simpanJadwal(dataBaru) {
    await setDoc(REF, { ...dataBaru, kodeMinggu: kodeMingguIni() })
  }

  return { jadwal, simpanJadwal }
}