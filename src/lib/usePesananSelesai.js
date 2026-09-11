import { useEffect, useMemo, useState } from 'react'
import { ref, set, remove, onValue } from 'firebase/database'
import { rtdb } from './firebase'
import { rtdbPath } from './demoPath'
import { useAuth } from '../context/AuthContext.jsx'

// Data ini SENGAJA disimpen di server (bukan cuma di memori app),
// biar walau Fajri nutup app-nya sebelum sempet nge-tap OK, begitu
// dia buka lagi, popup "Perjalanan Selesai" ini masih muncul —
// gak ilang gitu aja cuma karena app-nya sempet ketutup.
export function usePesananSelesai() {
  const { user, isDemo } = useAuth()
  const [data, setData] = useState(null)
  const REF = useMemo(() => ref(rtdb, rtdbPath('notifSelesai/penumpang', isDemo)), [isDemo])

  useEffect(() => {
    if (!user) return

    const berhentiDengar = onValue(REF, (snap) => {
      setData(snap.exists() ? snap.val() : null)
    })
    return berhentiDengar
  }, [user, REF])

  async function tandaiSelesai({ tanggal, tarif }) {
    await set(REF, { tanggal, tarif, dibuatPada: Date.now() })
  }

  async function hapusNotifSelesai() {
    await remove(REF)
  }

  return { data, tandaiSelesai, hapusNotifSelesai }
}
