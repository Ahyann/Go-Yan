import { useEffect, useMemo, useRef, useState } from 'react'
import { ref, set, remove, onValue } from 'firebase/database'
import { rtdb } from './firebase'
import { kirimNotifikasi } from './notifikasi'
import { rtdbPath } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'
import { catat } from './debugLog'

// Kalau pesan yang baru kita kirim hilang dari database dalam waktu sesingkat
// ini setelah terkonfirmasi, itu bukan dihapus user: biasanya perangkat lain
// yang masih menjalankan versi app lama (tab laptop yang lupa dimuat ulang,
// app layar utama yang masih jalan di background) yang ngehapusnya. Pesannya
// dikirim ulang sekali supaya gak ilang.
const JENDELA_PULIH_MS = 1500

// Format pesan di database: { v: 2, t: teks, f: foto (opsional), d: waktu }.
// Sengaja beda nama field dari versi lama (teks/foto/dibuatPada): perangkat
// yang masih menjalankan app versi lama gak ngenalin field baru, jadi gak
// nampilin bubble dan gak ikut-ikutan ngehapus pesan (versi lama pernah
// punya bug yang ngehapus pesan pas isinya ganti dari teks ke foto).
function bacaPesan(v) {
  if (!v) return null
  if (v.v === 2) return { teks: v.t ?? '', foto: v.f, dibuatPada: v.d }
  return { teks: v.teks ?? '', foto: v.foto, dibuatPada: v.dibuatPada } // format lama
}

// Satu "kotak pesan" di database (pesan/ojek atau pesan/penumpang): ngirim
// teks/foto, dengerin isinya, dan hapus.
export function usePesanChat({ nama, path, tujuanNotif, judulNotif }) {
  const { user, isDemo } = useAuth()
  const [pesan, setPesan] = useState(null)
  const [siap, setSiap] = useState(false)
  const terakhirKirimRef = useRef(null)
  const PESAN_REF = useMemo(
    () => ref(rtdb, rtdbPath(path, isDemo, user?.uid)),
    [path, isDemo, user?.uid]
  )

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onValue(PESAN_REF, (snap) => {
      const nilai = snap.exists() ? bacaPesan(snap.val()) : null
      catat(`[${nama}] data masuk:`, nilai ? (nilai.foto ? 'FOTO' : `teks "${nilai.teks}"`) : 'KOSONG')

      const k = terakhirKirimRef.current
      if (!nilai && k?.konfirmasiPada && !k.sudahDipulihkan && Date.now() - k.konfirmasiPada < JENDELA_PULIH_MS) {
        k.sudahDipulihkan = true
        catat(`[${nama}] pesan dihapus pihak lain sesaat setelah terkirim, dikirim ulang`)
        set(PESAN_REF, k.data).catch((err) => console.error('Gagal kirim ulang pesan:', err))
        return // jangan tutup bubble dulu, pesannya segera balik
      }

      setPesan(nilai)
      setSiap(true)
    })
    return berhentiDengar
  }, [user, PESAN_REF, nama])

  async function tulis(data) {
    terakhirKirimRef.current = { data, konfirmasiPada: 0, sudahDipulihkan: false }
    await set(PESAN_REF, data)
    if (terakhirKirimRef.current?.data === data) terakhirKirimRef.current.konfirmasiPada = Date.now()
    catat(`[${nama}] terkonfirmasi server`)
  }

  async function kirimPesan(teks) {
    if (!teks.trim()) return
    catat(`[${nama}] kirim teks`, teks.trim())
    await tulis({ v: 2, t: teks.trim(), d: Date.now() })
    if (!isDemo) kirimNotifikasi(tujuanNotif, judulNotif, teks.trim(), 'pesan')
  }

  async function kirimFoto(foto) {
    if (!foto) return
    catat(`[${nama}] kirim foto`)
    await tulis({ v: 2, t: '', f: foto, d: Date.now() })
    if (!isDemo) kirimNotifikasi(tujuanNotif, judulNotif, '📷 Foto', 'pesan')
  }

  async function hapusPesan() {
    catat(`[${nama}] HAPUS dipanggil dari:`, (new Error().stack || '').split(String.fromCharCode(10)).slice(2, 5).join(' < '))
    terakhirKirimRef.current = null // hapus sengaja, jangan dipulihkan
    await remove(PESAN_REF)
  }

  return { pesan, siap, kirimPesan, kirimFoto, hapusPesan }
}
