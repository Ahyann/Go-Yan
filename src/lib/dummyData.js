// Data contoh — bentuknya sengaja dibikin mirip dokumen Firestore nanti.
// Pas Fase 3 kita ganti sumbernya ke Firestore, komponen yang MEMAKAI data ini
// gak perlu diubah — cuma dari mana datanya diambil aja yang beda.

import { STATUS_RIDE, STATUS_BAYAR } from './constants'

export const dummyJadwal = [
  {
    id: 'j1',
    tanggal: '2026-08-03',
    jam: '07:00',
    catatan: 'Antar ke kampus',
    status: STATUS_RIDE.DIJADWALKAN,
  },
  {
    id: 'j2',
    tanggal: '2026-08-03',
    jam: '15:30',
    catatan: 'Jemput pulang',
    status: STATUS_RIDE.DIJADWALKAN,
  },
  {
    id: 'j3',
    tanggal: '2026-08-04',
    jam: '07:00',
    catatan: '',
    status: STATUS_RIDE.DIJADWALKAN,
  },
]

export const dummyRiwayat = [
  {
    id: 'r1',
    tanggal: '2026-08-01',
    jam: '07:05',
    tarif: 32000,
    statusBayar: STATUS_BAYAR.BELUM,
  },
  {
    id: 'r2',
    tanggal: '2026-07-31',
    jam: '15:40',
    tarif: 32000,
    statusBayar: STATUS_BAYAR.BELUM,
  },
  {
    id: 'r3',
    tanggal: '2026-07-31',
    jam: '07:00',
    tarif: 32000,
    statusBayar: STATUS_BAYAR.LUNAS,
  },
]