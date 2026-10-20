let audioCtx

function getAudioCtx() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

let spiderBuffer = null
let notifSelesaiBuffer = null
let chatBuffer = null
let reminderBuffer = null
let missionSuccessBuffer = null
let jarvisTerimaBuffer = null

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

async function muatJarvisTerimaBuffer() {
  jarvisTerimaBuffer = await muatBuffer('/sounds/jarvis_terima.mp3')
}

// Efek suara asisten AI buat voice line: sedikit "logam" (delay sangat pendek
// dengan umpan balik, bikin suara terdengar robotik) dan gema tipis. Semua
// tebalnya bisa disetel di sini; isi 0 buat mematikan efeknya.
export const EFEK_AI = {
  logam: 0, // 0 - 1, seberapa kuat suara logam/robot (sebelumnya dicoba 0.45)
  gema: 0, // 0 - 1, seberapa kuat gema (sebelumnya dicoba 0.28)
  waktuGema: 0.16, // detik antar gema
}

export function sambungkanEfekAi(ctx, sumber, tujuan = ctx.destination) {
  const kering = ctx.createGain()
  kering.gain.value = 0.85
  sumber.connect(kering)
  kering.connect(tujuan)

  if (EFEK_AI.logam > 0) {
    const sisir = ctx.createDelay(0.05)
    sisir.delayTime.value = 0.012
    const umpanSisir = ctx.createGain()
    umpanSisir.gain.value = 0.45
    const keluarSisir = ctx.createGain()
    keluarSisir.gain.value = EFEK_AI.logam
    sumber.connect(sisir)
    sisir.connect(umpanSisir)
    umpanSisir.connect(sisir)
    sisir.connect(keluarSisir)
    keluarSisir.connect(tujuan)
  }

  if (EFEK_AI.gema > 0) {
    const gema = ctx.createDelay(1)
    gema.delayTime.value = EFEK_AI.waktuGema
    const umpanGema = ctx.createGain()
    umpanGema.gain.value = 0.3
    const keluarGema = ctx.createGain()
    keluarGema.gain.value = EFEK_AI.gema
    sumber.connect(gema)
    gema.connect(umpanGema)
    umpanGema.connect(gema)
    gema.connect(keluarGema)
    keluarGema.connect(tujuan)
  }
}

function putarBufferDenganEfekAi(buffer) {
  const ctx = getAudioCtx()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  sambungkanEfekAi(ctx, source)
  source.start(0)
  return source
}

function putarBuffer(buffer) {
  const ctx = getAudioCtx()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(0)
  return source
}

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
  muatJarvisTerimaBuffer()

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

// Suara asisten AI: "Mission accepted. Proceeding to pickup." (Ahyan terima misi)
export async function playJarvisTerima() {
  const ctx = getAudioCtx()

  if (!jarvisTerimaBuffer) {
    await muatJarvisTerimaBuffer()
  }
  if (!jarvisTerimaBuffer) return false

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  if (ctx.state !== 'running') {
    antrikanSuara('playJarvisTerima')
    return false
  }

  putarBufferDenganEfekAi(jarvisTerimaBuffer)
  return true
}

// Ahyan menerima misi: suara asisten AI ("Mission accepted...") ngomong dulu
// sampai selesai, baru suara laba-laba (efek suaranya) main, jadi gak numpuk.
// Kalau salah satu suara gagal dimuat, yang satunya tetap main.
const JEDA_SEBELUM_LABA_LABA_MS = 150

export async function playMisiDiterima() {
  const ctx = getAudioCtx()

  if (!jarvisTerimaBuffer) await muatJarvisTerimaBuffer()
  if (!spiderBuffer) await muatSpiderBuffer()

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  if (ctx.state !== 'running') {
    antrikanSuara('playMisiDiterima')
    return false
  }

  const mainkanLabaLaba = () => {
    if (spiderBuffer) setTimeout(() => putarBuffer(spiderBuffer), JEDA_SEBELUM_LABA_LABA_MS)
  }

  if (!jarvisTerimaBuffer) {
    mainkanLabaLaba()
    return true
  }

  const sumber = putarBufferDenganEfekAi(jarvisTerimaBuffer)
  sumber.onended = mainkanLabaLaba
  return true
}

const PETA_FUNGSI_SUARA = {
  playSpiderSound,
  playNotifSelesai,
  playChatSound,
  playReminderSound,
  playMissionSuccess,
  playJarvisTerima,
  playMisiDiterima,
}