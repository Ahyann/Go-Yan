import { useEffect, useState } from 'react'
import { saatSesiBerakhir } from './bersihkanSesi'

// Riwayat chat sederhana: mencatat tiap pesan baru yang terlihat di perangkat ini
// (dari Ojek maupun Penumpang). Disimpan di localStorage supaya tidak hilang walau app
// ditutup atau halaman dimuat ulang; baru dikosongkan lewat kosongkanRiwayatChat() ketika
// perjalanan selesai atau dibatalkan. Database tetap hanya menyimpan satu pesan terakhir per
// orang, jadi pesan yang datang saat app tertutup tidak ikut tercatat.
const KUNCI = 'goyan:riwayat-chat'
const MAKS = 30
// Gambar foto ikut disimpan supaya bisa ditampilkan di chat, tapi hanya untuk foto terbaru
// (data fotonya besar). Foto yang lebih lama tinggal penanda `true`.
const MAKS_FOTO_TERSIMPAN = 5

function muat() {
  try {
    const mentah = localStorage.getItem(KUNCI)
    const data = mentah ? JSON.parse(mentah) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

let daftar = muat()
const pendengar = new Set()

function tambah(siapa, pesan) {
  if (!pesan?.dibuatPada) return
  const id = `${siapa}-${pesan.dibuatPada}`
  if (daftar.some((p) => p.id === id)) return
  daftar = [...daftar, { id, siapa, teks: pesan.teks || '', foto: typeof pesan.foto === 'string' ? pesan.foto : Boolean(pesan.foto), suara: typeof pesan.suara === 'string' ? pesan.suara : Boolean(pesan.suara), durasi: pesan.durasiSuara || 0, waktu: pesan.dibuatPada }]
    .sort((a, b) => a.waktu - b.waktu)
    .slice(-MAKS)
  let sisa = MAKS_FOTO_TERSIMPAN
  daftar = [...daftar].reverse().map((p) => {
    if (typeof p.foto !== 'string' && typeof p.suara !== 'string') return p
    if (sisa > 0) { sisa -= 1; return p }
    return { ...p, foto: typeof p.foto === 'string' ? true : p.foto, suara: typeof p.suara === 'string' ? true : p.suara }
  }).reverse()
  try { localStorage.setItem(KUNCI, JSON.stringify(daftar)) } catch { /* abaikan */ }
  pendengar.forEach((fn) => fn(daftar))
}

export function kosongkanRiwayatChat() {
  daftar = []
  try { localStorage.removeItem(KUNCI) } catch { /* abaikan */ }
  pendengar.forEach((fn) => fn(daftar))
}

saatSesiBerakhir(kosongkanRiwayatChat)

// pesanOjek dan pesanPenumpang: nilai `pesan` dari usePesanOjek / usePesanPenumpang.
export function useRiwayatChat(pesanOjek, pesanPenumpang) {
  const [riwayat, setRiwayat] = useState(daftar)

  useEffect(() => {
    pendengar.add(setRiwayat)
    return () => { pendengar.delete(setRiwayat) }
  }, [])

  useEffect(() => { tambah('ojek', pesanOjek) }, [pesanOjek])
  useEffect(() => { tambah('penumpang', pesanPenumpang) }, [pesanPenumpang])

  return riwayat
}
