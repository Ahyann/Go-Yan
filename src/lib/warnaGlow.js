export const WARNA_GLOW_PRESET = {
  biru: { nama: 'Biru', utama: '#5ED0FF', kuat: '#2B9EE8' },
  merah: { nama: 'Merah', utama: '#FF6B6B', kuat: '#E8404D' },
  hijau: { nama: 'Hijau', utama: '#5EFFB8', kuat: '#2BE89E' },
  ungu: { nama: 'Ungu', utama: '#B85EFF', kuat: '#8E2BE8' },
  emas: { nama: 'Emas', utama: '#FFD65E', kuat: '#E8B82B' },
}

export const DEFAULT_WARNA_GLOW = 'biru'

export function ambilWarnaGlow(namaWarna) {
  return WARNA_GLOW_PRESET[namaWarna] || WARNA_GLOW_PRESET[DEFAULT_WARNA_GLOW]
}