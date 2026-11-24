import { useSyncExternalStore } from 'react'

// Status layar welcome saat masuk akun demo. Disimpan di luar komponen halaman login karena layar welcome harus tetap
// tampil di atas app demo setelah login berhasil (saat itu halaman login sudah diganti app demo dan hilang).
let keadaan = null
const pendengar = new Set()

function kabari() {
  pendengar.forEach((fn) => fn())
}

// minMs: lama minimal layar tampil sebelum fokus ke app. Dipakai saat pindah peran demo (app sudah ada, jadi tanpa ini
// kacanya langsung memudar dan terasa mendadak). Masuk demo dan login biasa memakai 0: fokus begitu app siap.
export function mulaiTransisiDemo(peran, minMs = 0) {
  const sekarang = Date.now()
  keadaan = { peran, mulai: sekarang, fokusSetelah: sekarang + minMs }
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
