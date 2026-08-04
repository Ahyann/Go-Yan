import { useEffect } from 'react'
import { ref, set, onDisconnect, remove } from 'firebase/database'
import { rtdb } from './firebase'

export function usePresence(role) {
  useEffect(() => {
    if (!role) return
    const presenceRef = ref(rtdb, `presence/${role}`)

    function updatePresence() {
      set(presenceRef, document.visibilityState === 'visible')
    }

    updatePresence()
    onDisconnect(presenceRef).remove()

    document.addEventListener('visibilitychange', updatePresence)
    window.addEventListener('focus', updatePresence)
    window.addEventListener('blur', updatePresence)

    return () => {
      document.removeEventListener('visibilitychange', updatePresence)
      window.removeEventListener('focus', updatePresence)
      window.removeEventListener('blur', updatePresence)
      remove(presenceRef)
    }
  }, [role])
}