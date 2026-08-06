import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import { STATUS_PERMINTAAN } from './constants'
import { kirimNotifikasi } from './notifikasi'

// Satu dokumen tetap — app ini cuma butuh 1 permintaan aktif
// dalam satu waktu, jadi gak perlu koleksi dengan banyak dokumen.
const REF = doc(db, 'state', 'permintaanAktif')

export function usePermintaanAktif() {
  // undefined = belum tau (baru nyambung ke Firestore)
  // null      = udah tau, dan emang gak ada permintaan aktif
  // objek     = ada permintaan aktif, ini datanya
  const [permintaan, setPermintaan] = useState(undefined)

  useEffect(() => {
    // onSnapshot = "berlangganan". Callback ini kepanggil ulang OTOMATIS
    // tiap kali dokumen ini berubah di Firestore — gak peduli device
    // mana yang mengubahnya. Ini akar dari kenapa 2 browser bisa nyambung.
    const berhentiDengar = onSnapshot(REF, (snap) => {
      setPermintaan(snap.exists() ? snap.data() : null)
    })
    return berhentiDengar
  }, [])

  async function kirimGo({ aksi, where, waktu }) {
    // setDoc tanpa { merge: true } artinya TIMPA total — cocok di sini
    // karena tiap GO baru emang harus mulai dari status bersih (menunggu),
    // bukan nyampur sama sisa data permintaan sebelumnya.
    await setDoc(REF, {
      aksi,
      where,
      waktu,
      status: STATUS_PERMINTAAN.MENUNGGU,
      dibuatPada: Date.now(),
    })
    kirimNotifikasi(
      'ojek',
      'Pesenan baru! 🕸️',
      `Fajri mau ${aksi === 'jemput' ? 'dijemput' : 'diantar'} · ${where} · ${waktu}`,
      'pesenan'
    )
  }

  async function terima() {
    await updateDoc(REF, { status: STATUS_PERMINTAAN.DITERIMA })
  }

  async function tolak() {
    await updateDoc(REF, { status: STATUS_PERMINTAAN.DITOLAK })
  }

  async function selesai() {
    // deleteDoc, bukan cuma ganti status — begitu dihapus, snap.exists()
    // di listener jadi false, otomatis kebaca sebagai "gak ada permintaan
    // aktif" di kedua sisi, balik ke kondisi awal.
    await deleteDoc(REF)
  }

  async function batal() {
    // Sama kayak selesai() secara teknis (hapus dokumen), tapi beda
    // konteks: ini dipanggil PENUMPANG buat batalin permintaan DIA
    // SENDIRI, sebelum Ojek sempet nerima/tolak.
    await deleteDoc(REF)
  }

  return { permintaan, kirimGo, terima, tolak, selesai, batal }
}
