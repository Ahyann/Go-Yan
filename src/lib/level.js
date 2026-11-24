import { TARIF_PER_RIDE } from './constants'

// Level akun ojek: naik satu level tiap total pendapatan bertambah Rp500.000. Semua perjalanan di riwayat dihitung
// (sudah dibayar atau belum).
export const UANG_PER_LEVEL = 500000
// Akun demo: 4 trip per level (Rp128.000). Data demo diisi 3 riwayat contoh (Rp96.000), jadi trip pertama yang dicoba
// di demo langsung naik level dan animasi LEVEL UP terlihat.
export const UANG_PER_LEVEL_DEMO = TARIF_PER_RIDE * 4
export const uangPerLevel = (isDemo) => (isDemo ? UANG_PER_LEVEL_DEMO : UANG_PER_LEVEL)
// Sisa trip segini atau kurang dianggap "sudah dekat": tulisan di konsol berubah kuning berkedip
export const TRIP_DEKAT = 3

export function totalUangRiwayat(riwayat) {
  return riwayat.reduce((jumlah, r) => jumlah + (Number(r.tarif) || 0), 0)
}

export function hitungLevel(total, perLevel = UANG_PER_LEVEL, tarif = TARIF_PER_RIDE) {
  const aman = Math.max(0, Number(total) || 0)
  const diLevel = aman % perLevel
  const sisa = perLevel - diLevel
  return {
    level: Math.floor(aman / perLevel) + 1,
    diLevel,
    sisa,
    sisaTrip: Math.max(1, Math.ceil(sisa / tarif)),
    porsi: diLevel / perLevel,
  }
}

// Warna piala di konsol: perunggu sampai LV 29, perak LV 30-49, emas mulai LV 50
export function tingkatPiala(level) {
  if (level >= 50) return 'emas'
  if (level >= 30) return 'perak'
  return 'perunggu'
}
