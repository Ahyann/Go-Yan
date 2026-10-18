import { usePesanChat } from './usePesanChat'

// Pesan dari Fajri (penumpang) ke Ahyan.
export function usePesanPenumpang() {
  return usePesanChat({
    nama: 'penumpang',
    path: 'pesan/penumpang',
    tujuanNotif: 'ojek',
    judulNotif: 'Pesan dari Fajri 💬',
  })
}
