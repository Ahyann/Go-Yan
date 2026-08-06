// Suara ini dibuat langsung oleh browser (Web Audio API), BUKAN file
// audio yang diputar. Alasannya dua: (1) gak bisa makein rekaman asli
// dari film Spider-Man karena itu berhak cipta, (2) sintesis kode kayak
// gini nol kilobyte tambahan ke ukuran app — cocok sama prinsip "jangan
// berat" dari awal.
let audioCtx

function getAudioCtx() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

export function playThwip() {
  if (typeof window === 'undefined') return
  const ctx = getAudioCtx()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(1200, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)

  gain.gain.setValueAtTime(0.25, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start()
  osc.stop(ctx.currentTime + 0.2)
}

// --- Rekaman asli, diputar lewat Web Audio API (bukan elemen <audio>) ---
//
// Bedanya penting: <audio> harus "nyiapin diri" tiap kali disuruh main,
// dan itu latensinya gak konsisten (kadang instan, kadang delay dikit).
// Cara di bawah ini DECODE file mp3 SEKALI di awal jadi data audio mentah
// yang nangkring di memori (AudioBuffer) — begitu tombol ditekan, kita
// cuma bikin "pemutar" baru buat data yang udah siap itu, gak perlu baca
// ulang file dari awal. Hasilnya jauh lebih instan & konsisten.
let spiderBuffer = null
let notifSelesaiBuffer = null

async function muatBuffer(url) {
  try {
    const ctx = getAudioCtx()
    // { cache: 'no-store' }: paksa browser SELALU ambil file terbaru
    // dari server, jangan pernah pakai salinan lama yang udah kesimpen
    // sebelumnya — penting soalnya kita udah beberapa kali ganti isi
    // file mp3 ini dengan nama yang sama persis.
    const res = await fetch(url, { cache: 'no-store' })
    const arrayBuffer = await res.arrayBuffer()
    return await ctx.decodeAudioData(arrayBuffer)
  } catch (err) {
    console.error('Gagal muat suara:', url, err)
    return null
  }
}

async function muatSpiderBuffer() {
  spiderBuffer = await muatBuffer('/sounds/spider_sound.mp3')
}

async function muatNotifSelesaiBuffer() {
  notifSelesaiBuffer = await muatBuffer('/sounds/notifselesai.mp3')
}

function putarBuffer(buffer) {
  const ctx = getAudioCtx()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(0)
}

if (typeof window !== 'undefined') {
  muatSpiderBuffer()
  muatNotifSelesaiBuffer()

  // Lapis pengaman tambahan: begitu app balik aktif/keliatan lagi
  // (abis layar dikunci atau pindah app terus balik), langsung coba
  // "bangunin" AudioContext-nya duluan — jangan nunggu sampe tombol
  // beneran dipencet.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioCtx?.state === 'suspended') {
      audioCtx.resume()
    }
  })
}

export async function playSpiderSound() {
  const ctx = getAudioCtx()

  // Kalau bufferSuara-nya belum siap (misal app baru aja "dimuat
  // ulang total" sama iOS abis dipindah-pindah, jadi belum sempet
  // ke-load lagi), coba muat SEKARANG JUGA, jangan langsung nyerah.
  if (!spiderBuffer) {
    await muatSpiderBuffer()
  }
  if (!spiderBuffer) return

  // Browser kadang "menunda" AudioContext sampai ada interaksi user —
  // atau, kasus ini, ngebekuin dia total pas layar HP dikunci. Klik
  // tombol ini adalah interaksi buat bangunin lagi. PENTING: resume()
  // itu proses ASYNC (butuh waktu), jadi kita AWAIT dulu sampe bener-
  // bener kelar sebelum coba mainin suaranya — kalau enggak, suaranya
  // bisa gagal diputar diem-diem soalnya context-nya masih "setengah
  // bangun".
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  putarBuffer(spiderBuffer)
}

export async function playNotifSelesai() {
  const ctx = getAudioCtx()

  if (!notifSelesaiBuffer) {
    await muatNotifSelesaiBuffer()
  }
  if (!notifSelesaiBuffer) return

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  putarBuffer(notifSelesaiBuffer)
}
