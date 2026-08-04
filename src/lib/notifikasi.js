import { doc, setDoc } from 'firebase/firestore'
import { getToken, onMessage } from 'firebase/messaging'
import { db, getMessagingInstance } from './firebase'

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
  getMessagingInstance().then((messaging) => {
    if (!messaging) return
    onMessage(messaging, callback)
  })
}

export async function kirimNotifikasi(targetRole, title, body) {
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole, title, body }),
    })
  } catch (err) {
    console.error('Gagal kirim notifikasi:', err)
  }
}