// Semua hook data (Firestore & RTDB) manggil helper ini biar sesi demo
// (login anonim lewat tombol "Coba Demo") baca/tulis ke jalur data
// TERPISAH dari data asli Ahyan/Fajri — jadi orang yang lagi nyobain
// demo gak bisa liat atau ngerusak data beneran, dan sebaliknya.
//
// Di-scope per UID akun anonim (bukan 1 namespace "_demo" yang dipakai
// bareng semua orang), biar beberapa orang bisa nyoba demo bersamaan
// tanpa saling numpuk/ngerusak data satu sama lain.
export function firestoreId(nama, isDemo, uid) {
  return isDemo && uid ? `${nama}_demo_${uid}` : nama
}

export function rtdbPath(path, isDemo, uid) {
  return isDemo && uid ? `demo/${uid}/${path}` : path
}
