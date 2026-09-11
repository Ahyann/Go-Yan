import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { ref, remove } from 'firebase/database'
import { db, rtdb } from './firebase'
import { AKSI, STATUS_BAYAR } from './constants'
import { kodeMingguIni } from './useJadwalMingguan'

const NAMA_DOKUMEN_STATE = ['permintaanAktif', 'jadwalMingguan', 'profilIkon', 'profilWarna']

function tanggalLaluISO(hariLalu) {
  const d = new Date()
  d.setDate(d.getDate() - hariLalu)
  return d.toISOString().slice(0, 10)
}

const RIWAYAT_CONTOH = [
  { tanggal: tanggalLaluISO(1), jam: '07:15', tarif: 32000, statusBayar: STATUS_BAYAR.LUNAS, aksi: AKSI.JEMPUT, where: 'Kampus UPN' },
  { tanggal: tanggalLaluISO(1), jam: '16:40', tarif: 32000, statusBayar: STATUS_BAYAR.LUNAS, aksi: AKSI.ANTAR, where: 'Kantor' },
  { tanggal: tanggalLaluISO(3), jam: '07:20', tarif: 32000, statusBayar: STATUS_BAYAR.BELUM, aksi: AKSI.JEMPUT, where: 'Kampus UPN' },
]

const JADWAL_CONTOH = {
  senin: { antar: { aktif: false, jam: '' }, jemput: { aktif: true, jam: '07:15' }, selesai: false },
  selasa: { antar: { aktif: true, jam: '16:30' }, jemput: { aktif: false, jam: '' }, selesai: false },
  rabu: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
  kamis: { antar: { aktif: true, jam: '17:00' }, jemput: { aktif: true, jam: '07:15' }, selesai: false },
  jumat: { antar: { aktif: false, jam: '' }, jemput: { aktif: false, jam: '' }, selesai: false },
}

// Dipanggil begitu sesi demo baru mulai, biar app-nya keliatan "hidup"
// (ada riwayat & jadwal contoh) daripada kosong melompong pas dicoba.
// Di-scope per UID akun anonim (uid) biar orang lain yang lagi nyoba
// demo bersamaan gak keganggu / ke-timpa data contoh punya orang ini.
export async function seedDataDemo(uid) {
  if (!uid) return
  await Promise.all([
    ...RIWAYAT_CONTOH.map((data) =>
      addDoc(collection(db, `riwayat_demo_${uid}`), { ...data, dibuatPada: Date.now() }).catch(() => {})
    ),
    setDoc(doc(db, 'state', `jadwalMingguan_demo_${uid}`), {
      ...JADWAL_CONTOH,
      kodeMinggu: kodeMingguIni(),
    }).catch(() => {}),
  ])
}

async function hapusKoleksiRiwayatDemo(uid) {
  const snap = await getDocs(collection(db, `riwayat_demo_${uid}`))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}

// Dipanggil pas sesi demo logout — bersihin semua jejak data demo
// milik sesi INI doang (permintaan, riwayat, jadwal, icon/warna profil
// demo, lokasi/chat di RTDB), gak nyentuh data demo punya orang lain
// yang kebetulan lagi nyoba bersamaan.
export async function resetDataDemo(uid) {
  if (!uid) return
  await Promise.all([
    ...NAMA_DOKUMEN_STATE.map((nama) => deleteDoc(doc(db, 'state', `${nama}_demo_${uid}`)).catch(() => {})),
    hapusKoleksiRiwayatDemo(uid).catch(() => {}),
    remove(ref(rtdb, `demo/${uid}`)).catch(() => {}),
  ])
}
