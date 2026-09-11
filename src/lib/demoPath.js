// Semua hook data (Firestore & RTDB) manggil helper ini biar sesi demo
// (login anonim lewat tombol "Coba Demo") baca/tulis ke jalur data
// TERPISAH dari data asli Ahyan/Fajri — jadi orang yang lagi nyobain
// demo gak bisa liat atau ngerusak data beneran, dan sebaliknya.
export function firestoreId(nama, isDemo) {
  return isDemo ? `${nama}_demo` : nama
}

export function rtdbPath(path, isDemo) {
  return isDemo ? `demo/${path}` : path
}
