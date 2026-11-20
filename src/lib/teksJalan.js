// Tulisan berjalan di konsol ojek muncul di beberapa tempat (Home dan tab lain), jadi elemennya dibuat ulang
// setiap pindah tab dan animasinya mulai lagi dari awal. Dengan delay negatif yang dihitung dari jam,
// posisi tulisan selalu mengikuti waktu sekarang, sehingga pindah tab tidak membuatnya ter-reset.
const DURASI_DETIK = 22

export function gayaTeksJalan() {
  return { animationDelay: `-${((Date.now() / 1000) % DURASI_DETIK).toFixed(2)}s` }
}
