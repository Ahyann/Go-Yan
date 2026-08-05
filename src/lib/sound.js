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

async function muatSpiderBuffer() {
  try {
    const ctx = getAudioCtx()
    const res = await fetch('/sounds/spider_sound.mp3', { cache: 'no-store' })
    const arrayBuffer = await res.arrayBuffer()
    spiderBuffer = await ctx.decodeAudioData(arrayBuffer)
  } catch (err) {
    console.error('Gagal muat suara:', err)
  }
}

if (typeof window !== 'undefined') {
  muatSpiderBuffer()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioCtx?.state === 'suspended') {
      audioCtx.resume()
    }
  })
}

export async function playSpiderSound() {
  if (!spiderBuffer) return
  const ctx = getAudioCtx()

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  const source = ctx.createBufferSource()
  source.buffer = spiderBuffer
  source.connect(ctx.destination)
  source.start(0)
}