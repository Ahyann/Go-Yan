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
// Suara asisten AI (voice line). Satu entri per kalimat.
const URL_SUARA_AI = {
  terima: '/sounds/jarvis_terima.mp3', // "Mission accepted. Proceeding to pickup."
  pesan: '/sounds/jarvis_pesan.mp3', // "Request sent. Awaiting confirmation."
  batal: '/sounds/jarvis_batal.mp3', // "Request cancelled."
}
const bufferSuaraAi = {}

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

async function muatSuaraAi(kunci) {
  bufferSuaraAi[kunci] = await muatBuffer(URL_SUARA_AI[kunci])
}

// Efek suara asisten AI buat voice line: sedikit "logam" (delay sangat pendek
// dengan umpan balik, bikin suara terdengar robotik) dan gema tipis. Semua
// tebalnya bisa disetel di sini; isi 0 buat mematikan efeknya.
export const EFEK_AI = {
  logam: 0, // 0 - 1, seberapa kuat suara logam/robot (dicoba 0.45 dan 0.3, kerasa kayak gema)
  gema: 0, // 0 - 1, seberapa kuat gema (dicoba 0.28 dan 0.1, terlalu kerasa)
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
  Object.keys(URL_SUARA_AI).forEach(muatSuaraAi)

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

// Dua suara berurutan: suara asisten AI (voice line) dan suara laba-laba (efek
// suara). Yang kedua baru mulai setelah yang pertama selesai, jadi gak numpuk.
// Kalau salah satu gagal dimuat, yang satunya tetap main.
const JEDA_ANTAR_SUARA_MS = 150

async function mainkanDuaSuara(kunci, namaAntrian, labaLabaDulu) {
  const ctx = getAudioCtx()

  if (!bufferSuaraAi[kunci]) await muatSuaraAi(kunci)
  if (!spiderBuffer) await muatSpiderBuffer()

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  if (ctx.state !== 'running') {
    antrikanSuara(namaAntrian)
    return false
  }

  const suaraAi = () => putarBufferDenganEfekAi(bufferSuaraAi[kunci])
  const labaLaba = () => putarBuffer(spiderBuffer)
  const adaAi = Boolean(bufferSuaraAi[kunci])
  const adaLabaLaba = Boolean(spiderBuffer)

  const [pertama, kedua, adaPertama, adaKedua] = labaLabaDulu
    ? [labaLaba, suaraAi, adaLabaLaba, adaAi]
    : [suaraAi, labaLaba, adaAi, adaLabaLaba]

  const mainkanKedua = () => {
    if (adaKedua) setTimeout(kedua, JEDA_ANTAR_SUARA_MS)
  }

  if (!adaPertama) {
    mainkanKedua()
    return true
  }

  pertama().onended = mainkanKedua
  return true
}

// Suara AI saja, tanpa efek suara laba-laba.
async function mainkanSuaraAiSaja(kunci, namaAntrian) {
  const ctx = getAudioCtx()

  if (!bufferSuaraAi[kunci]) await muatSuaraAi(kunci)
  if (!bufferSuaraAi[kunci]) return false

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  if (ctx.state !== 'running') {
    antrikanSuara(namaAntrian)
    return false
  }

  putarBufferDenganEfekAi(bufferSuaraAi[kunci])
  return true
}

// Ahyan menerima misi: suara AI dulu, baru suara laba-laba.
export const playMisiDiterima = () => mainkanDuaSuara('terima', 'playMisiDiterima', false)

// Fajri selesai mengirim pesanan (GO): suara laba-laba dulu, baru suara AI.
export const playPesanTerkirim = () => mainkanDuaSuara('pesan', 'playPesanTerkirim', true)

// Fajri membatalkan pesanan: suara AI saja.
export const playBatalDipencet = () => mainkanSuaraAiSaja('batal', 'playBatalDipencet')

const PETA_FUNGSI_SUARA = {
  playSpiderSound,
  playNotifSelesai,
  playChatSound,
  playReminderSound,
  playMissionSuccess,
  playMisiDiterima,
  playPesanTerkirim,
  playBatalDipencet,
}