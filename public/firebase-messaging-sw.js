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

// ---- Cache gambar peta (MapTiler) ----
// Kotak peta yang sudah pernah dibuka disimpan di perangkat, jadi buka app berikutnya tidak perlu mengunduh
// ulang lewat internet HP. Cache-first; diminta ulang dengan mode CORS supaya hasilnya bisa disimpan tanpa
// memakan kuota berlebih (respons "opaque" dihitung jauh lebih besar oleh browser).
const CACHE_PETA = 'go-yan-peta-v1'
const BATAS_KOTAK = 900

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

async function ambilKotak(request) {
  const cache = await caches.open(CACHE_PETA)
  const tersimpan = await cache.match(request.url)
  if (tersimpan) return tersimpan
  try {
    const respons = await fetch(request.url, { mode: 'cors', credentials: 'omit' })
    if (respons.ok) {
      cache.put(request.url, respons.clone())
      // jaga ukuran cache: buang yang paling lama kalau kebanyakan
      cache.keys().then((kunci) => {
        if (kunci.length > BATAS_KOTAK) kunci.slice(0, kunci.length - BATAS_KOTAK).forEach((k) => cache.delete(k))
      })
    }
    return respons
  } catch {
    return fetch(request)
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.hostname === 'api.maptiler.com' && url.pathname.includes('/maps/')) {
    event.respondWith(ambilKotak(request))
  }
})
