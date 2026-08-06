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

let spiderBuffer = null
let notifSelesaiBuffer = null

async function muatBuffer(url) {
  try {
    const ctx = getAudioCtx()
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

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioCtx?.state === 'suspended') {
      audioCtx.resume()
    }
  })
}

export async function playSpiderSound() {
  const ctx = getAudioCtx()

  if (!spiderBuffer) {
    await muatSpiderBuffer()
  }
  if (!spiderBuffer) return

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  if (ctx.state !== 'running') return

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

  if (ctx.state === 'running') {
    putarBuffer(notifSelesaiBuffer)
    return
  }

  function tunggu() {
    document.removeEventListener('click', tunggu)
    document.removeEventListener('touchstart', tunggu)
    ctx.resume().then(() => {
      if (ctx.state === 'running') putarBuffer(notifSelesaiBuffer)
    })
  }
  document.addEventListener('click', tunggu, { once: true })
  document.addEventListener('touchstart', tunggu, { once: true })
}