import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const REF = doc(db, 'state', 'jadwalMingguan')

// Tiap slot (antar/jemput per hari) sekarang punya 2 field terpisah:
// `aktif` (boolean, toggle-nya nyala apa enggak) dan `jam` (opsional,
// bisa kosong). Dulu cuma 1 string doang, jadi gak bisa "aktif tapi
// jamnya belum diisi".
const KOSONG = {
  senin: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
  selasa: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
  rabu: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
  kamis: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
  jumat: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' } },
}

// Format tanggal pake komponen LOKAL (bukan toISOString, yang itungannya
// ikut UTC) — penting soalnya kalau pake UTC, pas dini hari WIB (misal
// jam 00:30), UTC-nya masih di HARI SEBELUMNYA, bikin "kode minggu"
// keliatan beda padahal masih di minggu yang sama, jadi ke-reset keliru.
function formatTanggalLokal(d) {
  const tahun = d.getFullYear()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const tanggal = String(d.getDate()).padStart(2, '0')
  return `${tahun}-${bulan}-${tanggal}`
}

// Tanggal Senin dari minggu yang sedang berjalan — dipakai sebagai
// "kode minggu". getDay(): 0=Minggu, 1=Senin, ..., 6=Sabtu.
function kodeMingguIni() {
  const d = new Date()
  const hari = d.getDay()
  const mundur = hari === 0 ? 6 : hari - 1 // jarak ke Senin minggu ini
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
        // Data ini dari minggu sebelumnya — dianggap kosong.
        // Firestore-nya sendiri TIDAK dihapus di sini, cuma yang
        // ditampilin ke layar yang dianggap "kosong lagi".
        setJadwal({ ...KOSONG, kodeMinggu: mingguSekarang })
        return
      }

      setJadwal({ ...KOSONG, ...data })
    })
    return berhentiDengar
  }, [])

  async function simpanJadwal(dataBaru) {
    // kodeMinggu selalu ditulis ULANG pakai minggu SEKARANG, apa pun
    // yang ada di draft — ini yang mastiin jadwal baru selalu "segar".
    await setDoc(REF, { ...dataBaru, kodeMinggu: kodeMingguIni() })
  }

  return { jadwal, simpanJadwal }
}
