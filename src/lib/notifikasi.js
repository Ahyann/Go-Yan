import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { getToken, onMessage } from 'firebase/messaging'
import { db, getMessagingInstance } from './firebase'

const VAPID_KEY = import.meta.env.VITE_FB_VAPID_KEY

// Minta izin notifikasi ke browser, terus kalau diizinin, simpan
// "alamat pengiriman" (token) ke Firestore biar backend tau ke mana
// harus ngirim notif buat akun ini.
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

// Dengerin notifikasi yang masuk SEMENTARA app-nya lagi kebuka aktif
// (foreground) — beda dari yang di service worker (yang buat pas
// app-nya ditutup/background).
export function dengarkanNotifForeground(callback) {
  getMessagingInstance().then((messaging) => {
    if (!messaging) return
    onMessage(messaging, callback)
  })
}

// Matiin notifikasi — hapus "alamat pengiriman" (token) yang kesimpen
// di Firestore, jadi backend gak nemu tujuan buat ngirim lagi ke
// device ini. Catatan: ini gak nyabut izin di level browser (itu
// emang gak bisa dilakuin app, cuma user sendiri lewat Settings) —
// tapi efeknya sama, notif beneran berhenti dikirim.
export async function matikanNotifikasi(uid) {
  try {
    await deleteDoc(doc(db, 'pushTokens', uid))
    return { berhasil: true }
  } catch (err) {
    return { berhasil: false, alasan: err.message }
  }
}

// Panggil ini buat beneran ngirim push notification. targetRole
// diisi 'ojek' atau 'penumpang' — backend cari semua token yang
// cocok, terus kirim ke situ. `tag` itu yang bikin notif SEJENIS
// gantiin satu sama lain di HP (bukan numpuk jadi banyak) — default-nya
// sama kayak `type`, jadi semua notif "pesenan baru" misalnya bakal
// otomatis collapse jadi 1 doang di tray notifikasi, walau kamu spam
// GO berkali-kali.
export async function kirimNotifikasi(targetRole, title, body, type = 'umum', tag = type) {
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole, title, body, type, tag }),
    })
  } catch (err) {
    // Notifikasi gagal kirim gak boleh bikin aksi utama (kirim GO,
    // terima, dll) ikut gagal — makanya cuma di-log, gak di-throw.
    console.error('Gagal kirim notifikasi:', err)
  }
}
