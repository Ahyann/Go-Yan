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

// 15 trip contoh: 12 sudah lunas dan 3 yang terbaru belum dibayar. Total Rp480.000 (15 x Rp32.000), tepat di bawah Rp500.000. Jadi akun demo mulai di
// LV 1 dan trip pertama yang dicoba langsung naik ke LV 2. Total level menghitung semua trip (lunas dan belum)
// dari riwayat yang sama, sedangkan "Sudah diterima" di tab Riwayat hanya menghitung yang lunas (12 x Rp32.000 = Rp384.000).
const TEMPAT_CONTOH = ['Kampus UPN', 'Kantor']
const JUMLAH_BELUM_BAYAR = 3 // trip contoh paling baru yang belum dibayar
const RIWAYAT_CONTOH = Array.from({ length: 15 }, (_, i) => ({
  tanggal: tanggalLaluISO(1 + Math.floor(i * 1.4)),
  jam: i % 2 ? '16:40' : '07:15',
  tarif: TARIF_PER_RIDE,
  statusBayar: i < JUMLAH_BELUM_BAYAR ? STATUS_BAYAR.BELUM : STATUS_BAYAR.LUNAS,
  aksi: i % 2 ? AKSI.ANTAR : AKSI.JEMPUT,
  where: TEMPAT_CONTOH[i % 2],
}))

const JADWAL_CONTOH = {
  senin: { antar: { aktif: false, jam: '' }, jemput: { aktif: true, jam: '07:15' }, selesai: false },
  selasa: { antar: { aktif: true, jam: '16:30' }, jemput: { aktif: false, jam: '' }, selesai: false },
  rabu: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
  kamis: { antar: { aktif: true, jam: '17:00' }, jemput: { aktif: true, jam: '07:15' }, selesai: false },
  jumat: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
  sabtu: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
  minggu: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
}

// Dipanggil begitu sesi demo baru mulai, biar app-nya keliatan "hidup"
// (ada riwayat & jadwal contoh) daripada kosong melompong pas dicoba.
// Semua sesi demo sengaja berbagi 1 data yang sama (lihat demoPath.js)
// biar demo Ojek & Penumpang di 2 window bisa saling connect.
export async function seedDataDemo() {
  const riwayatSnap = await getDocs(collection(db, 'riwayat_demo')).catch(() => null)
  const ada = riwayatSnap ? riwayatSnap.size : 0
  if (riwayatSnap && ada >= RIWAYAT_CONTOH.length) {
    // data demo lama yang semuanya sudah lunas: 3 trip terbaru dikembalikan jadi belum dibayar supaya riwayat terlihat hidup
    const docs = riwayatSnap.docs
    if (docs.every((d) => d.data().statusBayar === STATUS_BAYAR.LUNAS)) {
      const terbaru = [...docs].sort((a, b) => String(b.data().tanggal).localeCompare(String(a.data().tanggal))).slice(0, JUMLAH_BELUM_BAYAR)
      await Promise.all(terbaru.map((d) => updateDoc(d.ref, { statusBayar: STATUS_BAYAR.BELUM }).catch(() => {})))
    }
    return // udah lengkap, gak usah di-seed ulang
  }

  // data demo lama yang jumlahnya kurang (misalnya hanya 3 contoh) dilengkapi sampai 15; kalau kosong, jadwal ikut diisi
  const kosong = ada === 0
  const tambahan = RIWAYAT_CONTOH.slice(0, RIWAYAT_CONTOH.length - ada)

  await Promise.all([
    ...tambahan.map((data) =>
      addDoc(collection(db, 'riwayat_demo'), { ...data, dibuatPada: Date.now() - (RIWAYAT_CONTOH.length - tambahan.indexOf(data)) * 1000 }).catch(() => {})
    ),
    kosong && setDoc(doc(db, 'state', 'jadwalMingguan_demo'), {
      ...JADWAL_CONTOH,
      kodeMinggu: kodeMingguIni(),
    }).catch(() => {}),
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
