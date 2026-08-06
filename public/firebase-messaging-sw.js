importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js')

// Config Firebase ini AMAN ditulis manual di sini — beda dari API key
// rahasia (kayak MapTiler key), config Firebase Client emang dirancang
// buat kelihatan publik, itu bukan celah keamanan.
firebase.initializeApp({
  apiKey: 'AIzaSyAljLFkFtBQLnFC0A1Chky3X6kfYWfpEeE',
  authDomain: 'go-yan-5a7ed.firebaseapp.com',
  projectId: 'go-yan-5a7ed',
  storageBucket: 'go-yan-5a7ed.firebasestorage.app',
  messagingSenderId: '140606105483',
  appId: '1:140606105483:web:248f0740d0da55ba1d718e',
  databaseURL: 'https://go-yan-5a7ed-default-rtdb.asia-southeast1.firebasedatabase.app',
})

const messaging = firebase.messaging()

// Ini yang jalan pas ada notifikasi masuk SEMENTARA app-nya lagi
// ditutup/background — browser yang manggil ini otomatis, bukan
// kode app utama kita.
messaging.onBackgroundMessage(async (payload) => {
  // Khusus buat notif pesan bubble: cek dulu ke semua "jendela" app
  // yang lagi kebuka di HP ini. Kalau ketemu satu yang lagi keliatan
  // (visible), berarti user emang lagi mantengin app-nya — skip
  // notifnya, gak usah muncul kayak popup OS, soalnya bubble-nya udah
  // langsung keliatan di layar dia.
  if (payload.data?.type === 'pesan') {
    const semuaClient = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const adaYangKebuka = semuaClient.some((c) => c.visibilityState === 'visible')
    if (adaYangKebuka) return
  }

  const judul = payload.data?.title || 'Go-Yan'
  const opsi = {
    body: payload.data?.body || '',
    icon: '/icons/spidericon.png',
    badge: '/icons/spidericon.png',
    // `tag`: notif baru yang tag-nya SAMA otomatis GANTIIN yang lama
    // di tray notifikasi (bukan numpuk jadi banyak entri terpisah).
    // Ini yang bikin spam GO/Cancel berkali-kali cuma nyisain 1
    // notifikasi doang (yang paling baru), bukan numpuk belasan.
    tag: payload.data?.tag || 'go-yan-umum',
    renotify: true,
  }
  self.registration.showNotification(judul, opsi)
})
