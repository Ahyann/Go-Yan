import { useState } from 'react'

const DURASI_DETIK = 22

// Tulisan berjalan di konsol ojek. Delay animasinya dihitung dari jam SEKALI saat elemen dipasang, jadi:
// - pindah tab (elemen dipasang ulang) tetap melanjutkan dari posisi yang sama, tidak mulai dari awal;
// - render ulang biasa (data baru masuk, state berubah) tidak mengubah delay, yang kalau berubah akan membuat
//   animasi melompat. Dulu delay dihitung ulang di setiap render sehingga tab yang sering render ulang
//   (History, Account) membuat tulisannya terlihat mengulang.
export default function TeksJalan({ teks }) {
  const [delay] = useState(() => `-${((Date.now() / 1000) % DURASI_DETIK).toFixed(2)}s`)
  return <span className="teks-jalan" style={{ animationDelay: delay }}>{teks}{teks}</span>
}
