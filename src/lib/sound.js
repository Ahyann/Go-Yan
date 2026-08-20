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
let chatBuffer = null
let reminderBuffer = null
let missionSuccessBuffer = null

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

async function muatChatBuffer() {
  chatBuffer = await muatBuffer('/sounds/chat.mp3')
}

async function muatReminderBuffer() {
  reminderBuffer = await muatBuffer('/sounds/reminder.mp3')
}

async function muatMissionSuccessBuffer() {
  missionSuccessBuffer = await muatBuffer('/sounds/missionsuccess.mp3')
}

function putarBuffer(buffer) {
  const ctx = getAudioCtx()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(0)
}

// Kalau suatu suara GAGAL bunyi gara-gara AudioContext masih kekunci
// (misal app abis di-background terus HP-nya sengaja nyoba mainin
// suara notif sebelum sempet ada sentuhan baru), jangan langsung
// dibuang gitu aja — simpen dulu "siapa yang mau diputer", nanti
// begitu kamu nyentuh layar lagi (AudioContext kebuka), otomatis
// diputer. Jadi suaranya cuma TELAT dikit, bukan ilang sama sekali.
let suaraTertunda = null

function antrikanSuara(namaFungsi) {
  suaraTertunda = namaFungsi
}

function putarSuaraTertundaJikaAda() {
  if (!suaraTertunda) return
  const nama = suaraTertunda
  suaraTertunda = null
  PETA_FUNGSI_SUARA[nama]?.()
}

if (typeof window !== 'undefined') {
  muatSpiderBuffer()
  muatNotifSelesaiBuffer()
  muatChatBuffer()
  muatReminderBuffer()
  muatMissionSuccessBuffer()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioCtx?.state === 'suspended') {
      audioCtx.resume()
    }
  })

  const bukaKunciAudio = () => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        putarSuaraTertundaJikaAda()
      })
    } else {
      putarSuaraTertundaJikaAda()
    }
  }
  document.addEventListener('touchstart', bukaKunciAudio, { passive: true })
  document.addEventListener('touchend', bukaKunciAudio, { passive: true })
  document.addEventListener('click', bukaKunciAudio, { passive: true })
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

  if (ctx.state !== 'running') {
    antrikanSuara('playSpiderSound')
    return
  }

  putarBuffer(spiderBuffer)
}

export async function playNotifSelesai() {
  const ctx = getAudioCtx()

  if (!notifSelesaiBuffer) {
    await muatNotifSelesaiBuffer()
  }
  if (!notifSelesaiBuffer) return false

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  if (ctx.state !== 'running') {
    antrikanSuara('playNotifSelesai')
    return false
  }

  putarBuffer(notifSelesaiBuffer)
  return true
}

export async function playChatSound() {
  const ctx = getAudioCtx()

  if (!chatBuffer) {
    await muatChatBuffer()
  }
  if (!chatBuffer) return false

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  if (ctx.state !== 'running') {
    antrikanSuara('playChatSound')
    return false
  }

  putarBuffer(chatBuffer)
  return true
}

export async function playReminderSound() {
  const ctx = getAudioCtx()

  if (!reminderBuffer) {
    await muatReminderBuffer()
  }
  if (!reminderBuffer) return false

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  if (ctx.state !== 'running') {
    antrikanSuara('playReminderSound')
    return false
  }

  putarBuffer(reminderBuffer)
  return true
}

export async function playMissionSuccess() {
  const ctx = getAudioCtx()

  if (!missionSuccessBuffer) {
    await muatMissionSuccessBuffer()
  }
  if (!missionSuccessBuffer) return false

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  if (ctx.state !== 'running') {
    antrikanSuara('playMissionSuccess')
    return false
  }

  putarBuffer(missionSuccessBuffer)
  return true
}

const PETA_FUNGSI_SUARA = {
  playSpiderSound,
  playNotifSelesai,
  playChatSound,
  playReminderSound,
  playMissionSuccess,
}