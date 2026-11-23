import { useSyncExternalStore } from 'react'

// Status layar welcome saat masuk akun demo. Disimpan di luar komponen halaman login karena layar welcome harus tetap
// tampil di atas app demo setelah login berhasil (saat itu halaman login sudah diganti app demo dan hilang).
let keadaan = null
const pendengar = new Set()

function kabari() {
  pendengar.forEach((fn) => fn())
}

export function mulaiTransisiDemo(peran) {
  keadaan = { peran, mulai: Date.now() }
  kabari()
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
