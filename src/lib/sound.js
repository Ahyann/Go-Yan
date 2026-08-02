// Suara ini dibuat langsung oleh browser (Web Audio API), BUKAN file
// audio yang diputar. Alasannya dua: (1) gak bisa makein rekaman asli
// dari film Spider-Man karena itu berhak cipta, (2) sintesis kode kayak
// gini nol kilobyte tambahan ke ukuran app — cocok sama prinsip "jangan
// berat" dari awal.
//
// AudioContext cuma dibikin sekali, dipakai ulang terus — bikin baru
// tiap klik itu boros & bisa kena limit browser.
let audioCtx

export function playThwip() {
  if (typeof window === 'undefined') return

  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(1200, audioCtx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15)

  gain.gain.setValueAtTime(0.25, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18)

  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.start()
  osc.stop(audioCtx.currentTime + 0.2)
}

// Dibikin sekali di level modul, biar browser udah mulai nyiapin
// file-nya dari awal (preload), bukan baru mulai muat pas tombol
// ditekan — respons jadi lebih cepat.
const spiderAudio =
  typeof window !== 'undefined' ? new Audio('/sounds/spider_sound.mp3') : null
if (spiderAudio) spiderAudio.preload = 'auto'

export function playSpiderSound() {
  if (!spiderAudio) return
  spiderAudio.currentTime = 0
  spiderAudio.play().catch((err) => {
    console.error('Gagal muterin suara:', err)
  })
}