import { usePesanChat } from './usePesanChat'

// Pesan dari Ahyan (ojek) ke Fajri.
export function usePesanOjek() {
  return usePesanChat({
    nama: 'ojek',
    path: 'pesan/ojek',
    tujuanNotif: 'penumpang',
    judulNotif: 'Pesan dari Ahyan 🕸️',
  })
}
