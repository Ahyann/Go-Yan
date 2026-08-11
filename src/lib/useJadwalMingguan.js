import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const REF = doc(db, 'state', 'jadwalMingguan')

// Tiap slot (antar/jemput per hari) sekarang punya 3 field: `aktif`
// (toggle-nya nyala apa enggak), `jam` (opsional), dan `selesai`
// (ditandain Ahyan via swipe, nunjukkin dia udah beneran jalanin itu).
const KOSONG = {
  senin: { antar: { aktif: false, jam: '', selesai: false }, jemput: { aktif: false, jam: '', selesai: false } },
  selasa: { antar: { aktif: false, jam: '', selesai: false }, jemput: { aktif: false, jam: '', selesai: false } },
  rabu: { antar: { aktif: false, jam: '', selesai: false }, jemput: { aktif: false, jam: '', selesai: false } },
  kamis: { antar: { aktif: false, jam: '', selesai: false }, jemput: { aktif: false, jam: '', selesai: false } },
  jumat: { antar: { aktif: false, jam: '', selesai: false }, jemput: { aktif: false, jam: '', selesai: false } },
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

// Titik reset "minggu baru" ini SEKARANG di hari Sabtu jam 12:00 siang
// (bukan Senin pagi lagi). Jadi "kode minggu"-nya = tanggal Sabtu jam
// 12:00 TERAKHIR yang udah lewat (atau lagi terjadi tepat sekarang).
function kodeMingguIni() {
  const d = new Date()
  const hari = d.getDay() // 0=Minggu, 1=Senin, ..., 6=Sabtu

  // Jarak mundur (dalam hari) dari HARI INI ke Sabtu terdekat yang
  // sama atau sebelum hari ini.
  const mundurHari = (hari - 6 + 7) % 7

  const referensi = new Date(d)
  referensi.setDate(d.getDate() - mundurHari)
  referensi.setHours(12, 0, 0, 0)

  // Kalau referensi (Sabtu jam 12 di "minggu ini") ternyata masih di
  // MASA DEPAN dibanding sekarang (misal ini emang hari Sabtu, tapi
  // masih pagi, belum jam 12), berarti reset buat minggu ini BELUM
  // kejadian — mundur 1 minggu lagi ke Sabtu sebelumnya.
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

  // Nulis LANGSUNG ke server (gak lewat draft/Simpan) — biar swipe-nya
  // kerasa instan. Pake "dot notation" (`senin.antar.selesai`) sebagai
  // KEY, bukan object bersarang biasa — ini PENTING, soalnya kalau
  // pake object bersarang biasa (`{ senin: { antar: { selesai } } }`),
  // Firestore bakal TIMPA TOTAL isi "senin" itu (ilangin data jemput,
  // jam, dll). Dot notation cuma nyentuh 1 field spesifik itu doang,
  // gak ganggu apa pun di sebelahnya — aman walau Fajri lagi bersamaan
  // ngedit jadwal di device lain.
  async function tandaiSelesai(hari, aksi, nilaiBaru) {
    await setDoc(REF, { [`${hari}.${aksi}.selesai`]: nilaiBaru }, { merge: true })
  }

  return { jadwal, simpanJadwal, tandaiSelesai }
}
