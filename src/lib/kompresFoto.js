const LEBAR = 320
const TINGGI = 240
const BATAS_KARAKTER = 70000

function muatGambar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gambar gak bisa dibuka'))
    }
    img.src = url
  })
}

// Foto di chat cuma kepake selama pesanan aktif, jadi cukup dikecilin jadi
// 4:3 (320x240) dan disimpen sebagai teks di database bareng pesannya.
function sumberKeJpeg(sumber, lebarAsli, tinggiAsli, balik = false) {
  const canvas = document.createElement('canvas')
  canvas.width = LEBAR
  canvas.height = TINGGI
  const ctx = canvas.getContext('2d')

  // Potong tengah gambar ke rasio 4:3 (cover), bukan digepengin.
  const rasio = LEBAR / TINGGI
  let sw = lebarAsli
  let sh = tinggiAsli
  if (sw / sh > rasio) sw = sh * rasio
  else sh = sw / rasio
  const sx = (lebarAsli - sw) / 2
  const sy = (tinggiAsli - sh) / 2
  if (balik) {
    ctx.translate(LEBAR, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(sumber, sx, sy, sw, sh, 0, 0, LEBAR, TINGGI)

  let kualitas = 0.7
  let hasil = canvas.toDataURL('image/jpeg', kualitas)
  while (hasil.length > BATAS_KARAKTER && kualitas > 0.3) {
    kualitas -= 0.1
    hasil = canvas.toDataURL('image/jpeg', kualitas)
  }
  return hasil
}

export async function kompresFoto(file) {
  const img = await muatGambar(file)
  return sumberKeJpeg(img, img.naturalWidth, img.naturalHeight)
}

// Ambil satu frame dari <video> kamera.
// balik: dibalik kiri-kanan (buat kamera depan HP yang aliran videonya mirror).
export function kompresVideo(video, balik = false) {
  return sumberKeJpeg(video, video.videoWidth, video.videoHeight, balik)
}
