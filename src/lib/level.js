import { TARIF_PER_RIDE } from './constants'

// Level akun ojek: naik satu level tiap total pendapatan bertambah Rp500.000. Semua perjalanan di riwayat dihitung
// (sudah dibayar atau belum).
export const UANG_PER_LEVEL = 500000
// Sisa trip segini atau kurang dianggap "sudah dekat": tulisan di konsol berubah kuning berkedip
export const TRIP_DEKAT = 3

export function totalUangRiwayat(riwayat) {
  return riwayat.reduce((jumlah, r) => jumlah + (Number(r.tarif) || 0), 0)
}

export function hitungLevel(total, tarif = TARIF_PER_RIDE) {
  const aman = Math.max(0, Number(total) || 0)
  const diLevel = aman % UANG_PER_LEVEL
  const sisa = UANG_PER_LEVEL - diLevel
  return {
    level: Math.floor(aman / UANG_PER_LEVEL) + 1,
    diLevel,
    sisa,
    sisaTrip: Math.max(1, Math.ceil(sisa / tarif)),
    porsi: diLevel / UANG_PER_LEVEL,
  }
}
