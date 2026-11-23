import { useSyncExternalStore } from 'react'

// Status layar welcome saat masuk akun demo. Disimpan di luar komponen halaman login karena layar welcome harus tetap
// tampil di atas app demo setelah login berhasil (saat itu halaman login sudah diganti app demo dan hilang).
let keadaan = null
const pendengar = new Set()

function kabari() {
  pendengar.forEach((fn) => fn())
}

// minMs: lama minimal layar welcome tampil sebelum fokus ke app (login biasa selesai lebih cepat dari animasinya,
// jadi tanpa ini layar welcome hanya berkedip). Akun demo tidak butuh karena login demo memang butuh waktu.
export function mulaiTransisiDemo(peran, minMs = 0) {
  const sekarang = Date.now()
  keadaan = { peran, mulai: sekarang, fokusSetelah: sekarang + minMs }
  kabari()
}

// Selama animasi masuk (login biasa) berjalan, halaman login tetap ditampilkan walau akunnya sudah login, supaya logo
// sempat terbang penuh dan tidak terpotong oleh pergantian ke app.
let tahan = false
export function tahanHalamanLogin(nilai) {
  if (tahan === nilai) return
  tahan = nilai
  kabari()
}
export function useTahanHalamanLogin() {
  return useSyncExternalStore(langganan, () => tahan)
}

// Login biasa gagal setelah layar welcome sempat tampil: layar memudar keluar (lalu selesaiTransisiDemo dipanggil
// oleh TransisiDemo) supaya tidak hilang mendadak.
export function gagalTransisiDemo() {
  if (!keadaan) return
  keadaan = { ...keadaan, gagal: true }
  kabari()
}

export function selesaiTransisiDemo() {
  keadaan = null
  kabari()
}

function langganan(fn) {
  pendengar.add(fn)
  return () => pendengar.delete(fn)
}

export function useTransisiDemo() {
  return useSyncExternalStore(langganan, () => keadaan)
}
