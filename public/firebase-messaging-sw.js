importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js')

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

messaging.onBackgroundMessage(async (payload) => {
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
  }
  self.registration.showNotification(judul, opsi)
})