import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { ref, remove } from 'firebase/database'
import { db, rtdb } from './firebase'
import { AKSI, STATUS_BAYAR, TARIF_PER_RIDE } from './constants'
import { kodeMingguIni } from './useJadwalMingguan'

const NAMA_DOKUMEN_STATE = ['permintaanAktif', 'jadwalMingguan', 'profilIkon', 'profilWarna']

function tanggalLaluISO(hariLalu) {
  const d = new Date()
  d.setDate(d.getDate() - hariLalu)
  return d.toISOString().slice(0, 10)
}

// 15 trip contoh: 5 sudah lunas dan 10 yang terbaru belum dibayar. Total Rp480.000 (15 x Rp32.000), tepat di bawah Rp500.000. Jadi akun demo mulai di
// LV 1 dan trip pertama yang dicoba langsung naik ke LV 2. Total level menghitung semua trip (lunas dan belum)
// dari riwayat yang sama, sedangkan "Sudah diterima" di tab Riwayat hanya menghitung yang lunas (5 x Rp32.000 = Rp160.000).
const TEMPAT_CONTOH = ['Kampus UPN', 'Kantor']
const JUMLAH_BELUM_BAYAR = 10 // trip contoh paling baru yang belum dibayar
const RIWAYAT_CONTOH = Array.from({ length: 15 }, (_, i) => ({
  tanggal: tanggalLaluISO(1 + Math.floor(i * 1.4)),
  jam: i % 2 ? '16:40' : '07:15',
  tarif: TARIF_PER_RIDE,
  statusBayar: i < JUMLAH_BELUM_BAYAR ? STATUS_BAYAR.BELUM : STATUS_BAYAR.LUNAS,
  aksi: i % 2 ? AKSI.ANTAR : AKSI.JEMPUT,
  where: TEMPAT_CONTOH[i % 2],
}))

// Jadwal mingguan contoh: tiap hari isinya beda (jemput saja, antar saja, dua-duanya, jam berbeda-beda).
const HARI_JADWAL = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
const POLA_JADWAL = {
  senin: { jemput: '07:15' },
  selasa: { antar: '16:30' },
  rabu: { jemput: '07:30', antar: '17:15' },
  kamis: { antar: '12:30' },
  jumat: { jemput: '07:00', antar: '15:30' },
  sabtu: { jemput: '09:00' },
  minggu: { antar: '18:00' },
}
// Kandidat jam trip supaya selalu ada perjalanan dalam 24 jam ke depan (untuk prakiraan cuaca di konsol)
const KANDIDAT_TRIP = [
  ['07:15', 'jemput'],
  ['10:30', 'antar'],
  ['12:00', 'jemput'],
  ['16:30', 'antar'],
  ['19:30', 'jemput'],
  ['21:00', 'antar'],
]

// Membuat jadwal minggu ini: pola tiap hari yang berbeda-beda, hari yang sudah lewat ditandai selesai, lalu dua trip terdekat
// setelah sekarang (dalam 24 jam) dipastikan ada, jadi konsol cuaca selalu punya perjalanan untuk ditampilkan.
export function buatJadwalDemo(sekarang = new Date()) {
  const jadwal = {}
  HARI_JADWAL.forEach((nama) => {
    const p = POLA_JADWAL[nama]
    jadwal[nama] = {
      antar: { aktif: Boolean(p.antar), jam: p.antar || '' },
      jemput: { aktif: Boolean(p.jemput), jam: p.jemput || '' },
      selesai: false,
    }
  })
  const hariIni = (sekarang.getDay() + 6) % 7 // Senin = 0
  HARI_JADWAL.forEach((nama) => {
    const urut = (HARI_JADWAL.indexOf(nama) + 6) % 7
    if (urut < hariIni) jadwal[nama].selesai = true
  })
  // dua trip terdekat setelah sekarang (minimal 30 menit lagi) dalam 24 jam ke depan
  const batas = sekarang.getTime() + 30 * 60000
  const akhir = sekarang.getTime() + 24 * 3600000
  const calon = []
  for (let d = 0; d <= 1; d++) {
    const tgl = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate() + d)
    KANDIDAT_TRIP.forEach(([jam, jenis]) => {
      const t = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate(), Number(jam.slice(0, 2)), Number(jam.slice(3, 5))).getTime()
      if (t >= batas && t <= akhir) calon.push({ t, jam, jenis, nama: HARI_JADWAL[tgl.getDay()] })
    })
  }
  calon
    .sort((x, y) => x.t - y.t)
    .slice(0, 2)
    .forEach(({ jam, jenis, nama }) => {
      jadwal[nama][jenis] = { aktif: true, jam }
      jadwal[nama].selesai = false
    })
  return jadwal
}

// Dipanggil begitu sesi demo baru mulai, biar app-nya keliatan "hidup"
// (ada riwayat & jadwal contoh) daripada kosong melompong pas dicoba.
// Semua sesi demo sengaja berbagi 1 data yang sama (lihat demoPath.js)
// biar demo Ojek & Penumpang di 2 window bisa saling connect.
export async function seedDataDemo() {
  // jadwal dibuat ulang tiap sesi demo supaya selalu ada trip dalam 24 jam ke depan (untuk prakiraan cuaca)
  setDoc(doc(db, 'state', 'jadwalMingguan_demo'), { ...buatJadwalDemo(), kodeMinggu: kodeMingguIni() }).catch(() => {})

  const riwayatSnap = await getDocs(collection(db, 'riwayat_demo')).catch(() => null)
  const ada = riwayatSnap ? riwayatSnap.size : 0
  if (riwayatSnap && ada >= RIWAYAT_CONTOH.length) {
    // data demo lama yang trip belum dibayarnya kurang dari target: trip lunas yang terbaru dikembalikan jadi belum dibayar
    const docs = riwayatSnap.docs
    const kurang = JUMLAH_BELUM_BAYAR - docs.filter((d) => d.data().statusBayar !== STATUS_BAYAR.LUNAS).length
    if (kurang > 0) {
      const lunasTerbaru = docs
        .filter((d) => d.data().statusBayar === STATUS_BAYAR.LUNAS)
        .sort((a, b) => String(b.data().tanggal).localeCompare(String(a.data().tanggal)))
        .slice(0, kurang)
      await Promise.all(lunasTerbaru.map((d) => updateDoc(d.ref, { statusBayar: STATUS_BAYAR.BELUM }).catch(() => {})))
    }
    return // udah lengkap, gak usah di-seed ulang
  }

  // data demo lama yang jumlahnya kurang (misalnya hanya 3 contoh) dilengkapi sampai 15
  const tambahan = RIWAYAT_CONTOH.slice(0, RIWAYAT_CONTOH.length - ada)

  await Promise.all([
    ...tambahan.map((data) =>
      addDoc(collection(db, 'riwayat_demo'), { ...data, dibuatPada: Date.now() - (RIWAYAT_CONTOH.length - tambahan.indexOf(data)) * 1000 }).catch(() => {})
    ),
  ])
}

async function hapusKoleksiRiwayatDemo() {
  const snap = await getDocs(collection(db, 'riwayat_demo'))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}

// Dipanggil pas sesi demo logout — bersihin semua jejak data demo
// (permintaan, riwayat, jadwal, icon/warna profil demo, lokasi/chat di
// RTDB) biar orang berikutnya yang nyoba demo mulai dari kondisi bersih.
export async function resetDataDemo() {
  await Promise.all([
    ...NAMA_DOKUMEN_STATE.map((nama) => deleteDoc(doc(db, 'state', `${nama}_demo`)).catch(() => {})),
    hapusKoleksiRiwayatDemo().catch(() => {}),
    remove(ref(rtdb, 'demo')).catch(() => {}),
  ])
}
