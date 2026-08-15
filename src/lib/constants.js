export const TARIF_PER_RIDE = 32000
export const LOKASI_OFFICE = [-6.2146935, 106.8208587]
export const LOKASI_UPN = [-6.315979, 106.794749]

export const ROLE = {
  OJEK: 'ojek',
  PENUMPANG: 'penumpang',
}

export const STATUS_RIDE = {
  DIJADWALKAN: 'dijadwalkan',
  BERJALAN: 'berjalan',
  SELESAI: 'selesai',
  BATAL: 'batal',
}

export const STATUS_BAYAR = {
  BELUM: 'belum',
  LUNAS: 'lunas',
}

export const AKSI = {
  JEMPUT: 'jemput',
  ANTAR: 'antar',
}

export const WAKTU = {
  PAGI: 'pagi',
  SIANG: 'siang',
  SORE: 'sore',
  MALAM: 'malam',
}

export const STATUS_PERMINTAAN = {
  MENUNGGU: 'menunggu',
  DITERIMA: 'diterima',
  DITOLAK: 'ditolak',
}

export const HARI_KERJA_KEYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat']

export const formatRupiah = (angka) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka)
