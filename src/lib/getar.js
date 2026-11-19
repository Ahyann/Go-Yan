// Getaran saat Spiderman disentuh.
// Android: Vibration API biasa. iPhone tidak mendukung navigator.vibrate sama sekali, jadi dipakai trik
// saklar iOS (input checkbox "switch"): setiap kali saklar itu diklik, iOS 17.4 ke atas memberi ketukan haptic.
// Harus dipanggil dari dalam sentuhan pengguna supaya iOS mau menjalankannya.
let labelHaptic = null

function siapkanHaptic() {
  if (labelHaptic) return labelHaptic
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  input.id = 'goyan-haptic'
  input.tabIndex = -1
  const label = document.createElement('label')
  label.htmlFor = input.id
  label.setAttribute('aria-hidden', 'true')
  label.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
  label.appendChild(input)
  document.body.appendChild(label)
  labelHaptic = label
  return label
}

// pola: angka (ms) atau daftar [getar, jeda, getar, ...] seperti navigator.vibrate.
export function getar(pola = 20) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pola)
      return
    }
    const daftar = Array.isArray(pola) ? pola : [pola]
    let waktu = 0
    daftar.forEach((ms, i) => {
      if (i % 2 === 0) setTimeout(() => siapkanHaptic().click(), waktu)
      waktu += ms
    })
  } catch {
    // perangkat tanpa getaran: abaikan
  }
}

export const POLA_GETAR = {
  kaget: [30],
  senang: [15, 50, 15, 50, 25],
  kenyal: [20, 60, 30],
  bersin: [25, 500, 60],
  ngantuk: [40, 400, 40],
  angguk: [15, 140, 15, 140, 15],
  glitch: [10, 30, 10, 30, 10, 30, 10, 30, 10],
  joget: [20, 130, 20, 130, 20],
  bungee: [40, 250, 20, 200, 15],
  intip: [20, 600, 15],
  sense: [30, 60, 30, 60, 50],
  getar: [12, 30, 12, 30, 12, 30, 12],
}
