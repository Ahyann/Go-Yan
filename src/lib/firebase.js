import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL,
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey)

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null

export const auth = app ? getAuth(app) : null
// Data disimpan juga di perangkat (IndexedDB). Setelah app ditutup paksa lalu dibuka lagi, status terakhir (misalnya
// "menunggu driver") langsung terbaca dari penyimpanan, tidak menunggu koneksi ke server tersambung dulu; begitu server
// menjawab, data diperbarui. Kalau penyimpanan tidak bisa dipakai (mode privat, dll.), kembali ke cache memori biasa.
function buatFirestore() {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  } catch {
    return getFirestore(app)
  }
}
export const db = app ? buatFirestore() : null
export const rtdb = app ? getDatabase(app) : null

export async function getMessagingInstance() {
  if (!app) return null
  const { getMessaging, isSupported } = await import('firebase/messaging')
  const didukung = await isSupported().catch(() => false)
  if (!didukung) return null
  return getMessaging(app)
}