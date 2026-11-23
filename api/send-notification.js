import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { getFirestore } from 'firebase-admin/firestore'
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://go-yan-5a7ed-default-rtdb.asia-southeast1.firebasedatabase.app',
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!idToken) {
    return res.status(401).json({ error: 'Gak ada token' })
  }

  let pengirim
  try {
    pengirim = await getAuth().verifyIdToken(idToken)
  } catch {
    return res.status(401).json({ error: 'Token gak valid' })
  }

  // Akun demo (login anonim) bisa dibuat siapa saja lewat tombol demo, jadi tidak boleh mengirim notifikasi
  // ke HP asli. Hanya akun terdaftar yang boleh.
  if (pengirim.firebase?.sign_in_provider === 'anonymous') {
    return res.status(403).json({ error: 'Akun demo tidak boleh mengirim notifikasi' })
  }

  const { targetRole, title, body, type = 'umum', tag = type } = req.body || {}

  if (!targetRole || !title || !body) {
    return res.status(400).json({ error: 'targetRole, title, dan body wajib diisi' })
  }

  // Isi dibatasi: hanya dua peran yang ada, dan teks berupa string dengan panjang wajar
  if (!['ojek', 'penumpang'].includes(targetRole)) {
    return res.status(400).json({ error: 'targetRole tidak dikenal' })
  }
  if (typeof title !== 'string' || typeof body !== 'string' || title.length > 200 || body.length > 1000) {
    return res.status(400).json({ error: 'title atau body tidak valid' })
  }

  try {
    if (type === 'pesan') {
      const rtdb = getDatabase()
      const presenceSnap = await rtdb.ref(`presence/${targetRole}`).get()
      if (presenceSnap.exists() && presenceSnap.val() === true) {
        return res.status(200).json({ terkirim: 0, pesan: 'App tujuan lagi kebuka, notif di-skip' })
      }
    }

    const db = getFirestore()

    const snapshot = await db
      .collection('pushTokens')
      .where('role', '==', targetRole)
      .get()

    if (snapshot.empty) {
      return res.status(200).json({ terkirim: 0, pesan: 'Gak ada token buat role ini' })
    }

    const tokens = snapshot.docs.map((doc) => doc.data().token).filter(Boolean)

    if (tokens.length === 0) {
      return res.status(200).json({ terkirim: 0, pesan: 'Token kosong' })
    }

    const messaging = getMessaging()
    const hasil = await messaging.sendEachForMulticast({
      tokens,
      data: { title, body, type, tag },
      webpush: {
        fcmOptions: {
          link: 'https://go-yan.vercel.app',
        },
      },
    })

    return res.status(200).json({
      terkirim: hasil.successCount,
      gagal: hasil.failureCount,
    })
  } catch (err) {
    console.error('Gagal kirim notifikasi:', err)
    return res.status(500).json({ error: err.message })
  }
}
