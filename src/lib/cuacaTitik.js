import { useEffect, useState } from 'react'
import { LOKASI_POI } from './lokasiPOI'
import { unduhCuaca } from './statusSiaga'

// Cuaca untuk titik-titik yang sudah tersimpan di app (Kantor, Kampus, Rumah Fajri), supaya cuaca tempat jemput bisa
// dilihat walaupun kamu sedang berada di tempat lain. Disimpan 15 menit di HP dan dibagi antar komponen.
export const NAMA_TITIK = { kantor: 'KANTOR', kampus: 'KAMPUS', rumah: 'RUMAH FAJRI' }
export const TITIK = LOKASI_POI.filter((p) => NAMA_TITIK[p.id]).map((p) => ({ id: p.id, nama: NAMA_TITIK[p.id], lat: p.lat, lng: p.lng }))
const KUNCI = 'goyan:cuaca-titik'
const BASI_MS = 15 * 60 * 1000
const JARAK_DEKAT_M = 400 // posisimu dianggap "di" suatu titik kalau jaraknya kurang dari ini

function baca() {
  try { return JSON.parse(localStorage.getItem(KUNCI) || '{}') || {} } catch { return {} }
}

let data = baca() // { [id]: { waktu, suhu, kode, jam } }
let terakhirMuat = 0
const pendengar = new Set()

function simpan(id, hasil) {
  data = { ...data, [id]: { waktu: Date.now(), ...hasil } }
  try { localStorage.setItem(KUNCI, JSON.stringify(data)) } catch { /* penyimpanan diblokir */ }
  pendengar.forEach((f) => f())
}

function muatSemua() {
  if (Date.now() - terakhirMuat < BASI_MS) return
  terakhirMuat = Date.now()
  TITIK.forEach((t) => {
    const cache = data[t.id]
    if (cache && Date.now() - cache.waktu < BASI_MS && Array.isArray(cache.jam) && cache.jam.length > 0) return
    unduhCuaca(Math.round(t.lat * 100) / 100, Math.round(t.lng * 100) / 100)
      .then((hasil) => { if (hasil) simpan(t.id, hasil) })
      .catch(() => { /* offline: pakai cuaca terakhir kalau ada */ })
  })
}

export function jarakMeter(a, b) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Titik tersimpan yang paling dekat dengan posisimu (kalau kurang dari 400 m), atau null
export function titikDekat(posisi) {
  if (!posisi) return null
  let terbaik = null
  for (const t of TITIK) {
    const d = jarakMeter(posisi, t)
    if (d < JARAK_DEKAT_M && (!terbaik || d < terbaik.d)) terbaik = { ...t, d }
  }
  return terbaik
}

// { kantor: { suhu, kode, jam }, kampus: ..., rumah: ... }; kosong sampai datanya terunduh
export function useCuacaTitik() {
  const [, setDetak] = useState(0)
  useEffect(() => {
    const ulang = () => setDetak((n) => n + 1)
    pendengar.add(ulang)
    muatSemua()
    const id = setInterval(muatSemua, BASI_MS)
    return () => {
      pendengar.delete(ulang)
      clearInterval(id)
    }
  }, [])
  return data
}
