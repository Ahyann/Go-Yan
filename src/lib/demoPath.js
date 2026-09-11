// Semua hook data (Firestore & RTDB) manggil helper ini biar sesi demo
// (login anonim lewat tombol "Coba Demo") baca/tulis ke jalur data
// TERPISAH dari data asli Ahyan/Fajri — jadi orang yang lagi nyobain
// demo gak bisa liat atau ngerusak data beneran, dan sebaliknya.
//
// Semua sesi demo (siapa pun yang klik "Coba Demo") SENGAJA berbagi
// 1 namespace yang sama, bukan dipisah per orang — biar demo Ojek &
// Penumpang di 2 window/device bisa saling connect dan nunjukkin
// fitur live-sync-nya, sama kayak akun asli Ahyan & Fajri.
export function firestoreId(nama, isDemo) {
  return isDemo ? `${nama}_demo` : nama
}

export function rtdbPath(path, isDemo) {
  return isDemo ? `demo/${path}` : path
}
