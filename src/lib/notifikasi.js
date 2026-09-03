import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db, auth, getMessagingInstance } from './firebase'

const VAPID_KEY = import.meta.env.VITE_FB_VAPID_KEY

export async function mintaIzinDanSimpanToken(uid, role) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { berhasil: false, alasan: 'Browser ini gak dukung notifikasi.' }
  }

  const izin = await Notification.requestPermission()
  if (izin !== 'granted') {
    return { berhasil: false, alasan: 'Izin notifikasi ditolak.' }
  }

  const messaging = await getMessagingInstance()
  if (!messaging) {
    return {
      berhasil: false,
      alasan: 'Browser ini gak dukung push notification. Di iPhone, app harus di-install ke Home Screen dulu (Add to Home Screen).',
    }
  }

  try {
    const { getToken } = await import('firebase/messaging')
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (!token) {
      return { berhasil: false, alasan: 'Gagal dapetin token notifikasi.' }
    }

    await setDoc(doc(db, 'pushTokens', uid), {
      token,
      role,
      updatedAt: Date.now(),
    })

    return { berhasil: true }
  } catch (err) {
    return { berhasil: false, alasan: err.message }
  }
}

export function dengarkanNotifForeground(callback) {
  getMessagingInstance().then(async (messaging) => {
    if (!messaging) return
    const { onMessage } = await import('firebase/messaging')
    onMessage(messaging, callback)
  })
}

export async function cekStatusNotifikasi(uid) {
  try {
    const snap = await getDoc(doc(db, 'pushTokens', uid))
    return snap.exists()
  } catch {
    return false
  }
}

export async function matikanNotifikasi(uid) {
  try {
    await deleteDoc(doc(db, 'pushTokens', uid))
    return { berhasil: true }
  } catch (err) {
    return { berhasil: false, alasan: err.message }
  }
}

export async function kirimNotifikasi(targetRole, title, body, type = 'umum', tag = type) {
  try {
    const token = await auth?.currentUser?.getIdToken()
    if (!token) return

    await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetRole, title, body, type, tag }),
    })
  } catch (err) {
    console.error('Gagal kirim notifikasi:', err)
  }
}