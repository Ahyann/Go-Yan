import { useEffect, useMemo, useState } from 'react'
import { ref, set, remove, onValue } from 'firebase/database'
import { rtdb } from './firebase'
import { kirimNotifikasi } from './notifikasi'
import { rtdbPath } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'
import { catat } from './debugLog'

export function usePesanOjek() {
  const { user, isDemo } = useAuth()
  const [pesan, setPesan] = useState(null)
  const [siap, setSiap] = useState(false)
  const PESAN_REF = useMemo(
    () => ref(rtdb, rtdbPath('pesan/ojek', isDemo, user?.uid)),
    [isDemo, user?.uid]
  )

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onValue(PESAN_REF, (snap) => {
      const nilai = snap.exists() ? snap.val() : null
      catat('[ojek] data masuk:', nilai ? (nilai.foto ? 'FOTO' : `teks "${nilai.teks}"`) : 'KOSONG')
      setPesan(nilai)
      setSiap(true)
    })
    return berhentiDengar
  }, [user, PESAN_REF])

  async function kirimPesan(teks) {
    if (!teks.trim()) return
    catat('[ojek] kirim teks'  , teks.trim())
    await set(PESAN_REF, { teks: teks.trim(), dibuatPada: Date.now() })
    catat('[ojek] teks terkonfirmasi server')
    if (!isDemo) kirimNotifikasi('penumpang', 'Pesan dari Ahyan 🕸️', teks.trim(), 'pesan')
  }

  async function kirimFoto(foto) {
    if (!foto) return
    catat('[ojek] kirim foto')
    await set(PESAN_REF, { teks: '', foto, dibuatPada: Date.now() })
    catat('[ojek] foto terkonfirmasi server')
    if (!isDemo) kirimNotifikasi('penumpang', 'Pesan dari Ahyan 🕸️', '📷 Foto', 'pesan')
  }

  async function hapusPesan() {
    catat('[ojek] HAPUS dipanggil dari:', (new Error().stack || '').split(String.fromCharCode(10)).slice(2, 5).join(' < '))
    await remove(PESAN_REF)
  }

  return { pesan, siap, kirimPesan, kirimFoto, hapusPesan }
}
