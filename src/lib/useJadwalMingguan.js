import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const REF = doc(db, 'state', 'jadwalMingguan')

const KOSONG = {
  senin: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
  selasa: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
  rabu: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
  kamis: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
  jumat: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
}

function formatTanggalLokal(d) {
  const tahun = d.getFullYear()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const tanggal = String(d.getDate()).padStart(2, '0')
  return `${tahun}-${bulan}-${tanggal}`
}

// Titik reset "minggu baru" ini SEKARANG di hari Sabtu jam 12:00 siang
// (bukan Senin pagi lagi). Jadi "kode minggu"-nya = tanggal Sabtu jam
// 12:00 TERAKHIR yang udah lewat (atau lagi terjadi tepat sekarang).
function kodeMingguIni() {
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