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
  sabtu: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
  minggu: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
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

  // Minggu jadwal dimulai Senin 00:00 (jadwal berisi Senin sampai Minggu, jadi direset saat Senin dimulai)
  const mundurHari = (hari - 1 + 7) % 7

  const referensi = new Date(d)
  referensi.setDate(d.getDate() - mundurHari)
  referensi.setHours(0, 0, 0, 0)

  return formatTanggalLokal(referensi)
}

// Jadwal lama memakai kode Sabtu 12:00. Kode Sabtu itu masih dianggap minggu ini kalau jatuh antara Sabtu sebelum
// Senin minggu ini sampai Sabtu minggu ini, supaya jadwal yang sudah diisi tidak hilang saat aturan reset berganti.
function kodeLamaMasihBerlaku(kode, mingguSekarang) {
  if (!kode) return false
  const k = new Date(`${kode}T12:00:00`)
  if (Number.isNaN(k.getTime()) || k.getDay() !== 6) return false
  const senin = new Date(`${mingguSekarang}T12:00:00`).getTime()
  const selisihHari = Math.round((k.getTime() - senin) / 86400000)
  return selisihHari >= -2 && selisihHari <= 5
}

export function useJadwalMingguan() {
  const { user, isDemo } = useAuth()
  const [jadwal, setJadwal] = useState(undefined)
  const REF = useMemo(
    () => doc(db, 'state', firestoreId('jadwalMingguan', isDemo, user?.uid)),
    [isDemo, user?.uid]
  )

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onSnapshot(REF, (snap) => {
      const mingguSekarang = kodeMingguIni()

      if (!snap.exists()) {
        setJadwal({ ...KOSONG, kodeMinggu: mingguSekarang })
        return
      }

      const data = snap.data()
      if (data.kodeMinggu !== mingguSekarang && !kodeLamaMasihBerlaku(data.kodeMinggu, mingguSekarang)) {
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