// Jadwal jemput/antar yang sudah diisi (jadwalMingguan): dipakai halaman cuaca dan slot cuaca di konsol siaga
const HARI = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
const pad = (n) => String(n).padStart(2, '0')
const tglIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Jadwal untuk satu jam prakiraan ({ tgl, w }): [{ jenis: 'jemput' | 'antar', jam: 'HH:MM' }]
export function acaraJam(jadwal, j) {
  if (!jadwal || !j.tgl) return []
  const h = jadwal[HARI[new Date(`${j.tgl}T12:00:00`).getDay()]]
  if (!h) return []
  const hasil = []
  for (const jenis of ['jemput', 'antar']) {
    const a = h[jenis]
    if (a?.aktif && a.jam && a.jam.slice(0, 2) === j.w.slice(0, 2)) hasil.push({ jenis, jam: a.jam })
  }
  return hasil
}

// Jadwal jemput/antar terdekat dalam 24 jam ke depan (memakai jam HP): { jenis, jam, tgl, sisa } atau null
export function jadwalTerdekat(jadwal, sekarang) {
  if (!jadwal) return null
  let terbaik = null
  for (let d = 0; d <= 1; d++) {
    const tgl = new Date(sekarang + d * 86400000)
    const h = jadwal[HARI[tgl.getDay()]]
    if (!h) continue
    for (const jenis of ['jemput', 'antar']) {
      const a = h[jenis]
      if (!a?.aktif || !/^\d{2}:\d{2}$/.test(a.jam || '')) continue
      const t = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate(), Number(a.jam.slice(0, 2)), Number(a.jam.slice(3, 5))).getTime()
      const sisa = t - sekarang
      if (sisa > -60000 && sisa <= 86400000 && (!terbaik || sisa < terbaik.sisa)) terbaik = { jenis, jam: a.jam, tgl: tglIso(tgl), sisa }
    }
  }
  return terbaik
}

// Prakiraan di satu titik untuk jam jadwal terdekat, dari daftar jam titik itu; null kalau jamnya di luar prakiraan
export function cuacaPadaJadwal(jam, terdekat) {
  if (!terdekat || !Array.isArray(jam)) return null
  return jam.find((j) => j.tgl === terdekat.tgl && j.w.slice(0, 2) === terdekat.jam.slice(0, 2)) || null
}
