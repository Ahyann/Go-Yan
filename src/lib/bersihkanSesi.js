// Dipanggil saat logout (dan saat sesi demo baru dimulai): semua jejak milik akun di perangkat ini dibuang, baik yang
// tersimpan di HP maupun yang masih menempel di memori app. Pengaturan perangkat (bahasa, mode suara, data bensin,
// blokir salah password) sengaja tidak disentuh.
const KUNCI_SESI = [
  'goyan:misi-selesai',
  'goyan:menunggu',
  'goyan:menunggu-ojek',
  'goyan:permintaan-terakhir',
  'goyan:riwayat-chat',
  'goyan:slot-chat',
  'goyan:anim-diterima',
  'goyan:undo-lunas',
  'goyan:undo-lunas-demo',
  'goyan:undo-jadwal',
  'goyan:undo-jadwal-demo',
  'go-yan-riwayat-terakhir-dilihat-ojek',
  'go-yan-riwayat-terakhir-dilihat-penumpang',
  'go-yan-peta-terakhir-ojek',
  'go-yan-peta-terakhir-penumpang',
]

const pembersih = new Set()
// Modul yang menyimpan keadaan di memori mendaftarkan fungsi pembersihnya di sini
export function saatSesiBerakhir(fn) {
  pembersih.add(fn)
}

export function bersihkanSesi() {
  try {
    KUNCI_SESI.forEach((k) => localStorage.removeItem(k))
    sessionStorage.removeItem('goyan:chat-ojek-buka')
  } catch {
    // penyimpanan diblokir: tidak ada yang tersimpan untuk dibuang
  }
  pembersih.forEach((fn) => fn())
}
