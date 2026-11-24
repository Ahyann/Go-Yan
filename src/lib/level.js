import { TARIF_PER_RIDE } from './constants'

// Level akun ojek: naik satu level tiap total pendapatan bertambah Rp500.000. Semua perjalanan di riwayat dihitung
// (sudah dibayar atau belum).
export const UANG_PER_LEVEL = 500000
// Akun demo memakai aturan yang sama (Rp500.000 per level). Parameter isDemo disimpan supaya pemanggil tidak berubah.
export const uangPerLevel = () => UANG_PER_LEVEL
// Pendapatan awal akun demo: 75 trip (Rp2.400.000). Ditambah 3 riwayat contoh (Rp96.000) totalnya Rp2.496.000,
// yaitu LV 5 tepat di bawah Rp2.500.000, jadi trip pertama yang dicoba di demo langsung naik ke LV 6.
export const PENDAPATAN_AWAL_DEMO = TARIF_PER_RIDE * 75
// jumlah trip yang setara dengan pendapatan awal demo, supaya total trip cocok dengan total uang
export const TRIP_AWAL_DEMO = PENDAPATAN_AWAL_DEMO / TARIF_PER_RIDE

// Total pendapatan untuk level: semua riwayat, ditambah pendapatan awal kalau akun demo
export function totalUangLevel(riwayat, isDemo) {
  return totalUangRiwayat(riwayat) + (isDemo ? PENDAPATAN_AWAL_DEMO : 0)
}
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
    total: aman,
    // total uang yang harus dicapai untuk naik ke level berikutnya
    target: (Math.floor(aman / perLevel) + 1) * perLevel,
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
