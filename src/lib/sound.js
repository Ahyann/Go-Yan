// ---------- Mode suara (pengaturan per perangkat) ----------
// normal: semua bunyi. tanpa-voice: efek suara tetap ada, voice over asisten AI
// mati. senyap: gak ada suara sama sekali dari app (suara notifikasi dari HP
// diatur sistem HP, bukan app).
export const MODE_SUARA = { NORMAL: 'normal', TANPA_VOICE: 'tanpa-voice', SENYAP: 'senyap' }
const KUNCI_MODE_SUARA = 'goyan-mode-suara'

function bacaModeSuara() {
  try {
    const tersimpan = localStorage.getItem(KUNCI_MODE_SUARA)
    return Object.values(MODE_SUARA).includes(tersimpan) ? tersimpan : MODE_SUARA.TANPA_VOICE
  } catch {
    return MODE_SUARA.TANPA_VOICE
  }
}

let modeSuara = bacaModeSuara()
const pendengarMode = new Set()

export function ambilModeSuara() {
  return modeSuara
}

export function dengarkanModeSuara(fungsi) {
  pendengarMode.add(fungsi)
  return () => pendengarMode.delete(fungsi)
}

export function aturModeSuara(mode) {
  if (!Object.values(MODE_SUARA).includes(mode)) return
  modeSuara = mode
  try {
    localStorage.setItem(KUNCI_MODE_SUARA, mode)
  } catch {
    // penyimpanan diblokir, pilihan cuma berlaku sampai app ditutup
  }
  if (mode === MODE_SUARA.SENYAP) suaraTertunda = null // jangan bunyi nanti pas layar disentuh
  pendengarMode.forEach((fungsi) => fungsi())
}

const efekBoleh = () => modeSuara !== MODE_SUARA.SENYAP
const voiceBoleh = () => modeSuara === MODE_SUARA.NORMAL

let audioCtx

function getAudioCtx() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

let spiderBuffer = null
let notifSelesaiBuffer = null
let chatBuffer = null
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
    const res = await fetch(url)
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
  // Delapan file suara (sekitar 500 KB) TIDAK diunduh saat app dibuka: itu berebut sinyal dan CPU dengan hal yang lebih
  // penting (JavaScript, login, peta). Dimuat setelah app tenang; kalau ada suara diputar lebih dulu, fungsi pemutarnya
  // memuat file yang dibutuhkan sendiri.
  const muatSemuaSuara = () => {
    muatSpiderBuffer()
    muatNotifSelesaiBuffer()
    muatChatBuffer()
    muatMissionSuccessBuffer()
    Object.keys(URL_SUARA_AI).forEach(muatSuaraAi)
  }
  const jadwalkanMuatSuara = () => setTimeout(() => ('requestIdleCallback' in window ? window.requestIdleCallback(muatSemuaSuara, { timeout: 8000 }) : muatSemuaSuara()), 4000)
  if (document.readyState === 'complete') jadwalkanMuatSuara()
  else window.addEventListener('load', jadwalkanMuatSuara, { once: true })

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
  if (!efekBoleh()) return false
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
  if (!efekBoleh()) return false
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
  if (!efekBoleh()) return false
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

// Pengingat keberangkatan. Belum punya file suara sendiri (reminder.mp3 gak
// pernah ada), jadi sementara pakai bunyi chat. Kalau nanti ada file khusus,
// tambahin lagi buffer-nya di sini.
export function playReminderSound() {
  return playChatSound()
}

export async function playMissionSuccess() {
  if (!efekBoleh()) return false
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

// Bip piksel pendek tiap kali jari pindah ke pesan lain di roda quick chat. Dibuat langsung
// dengan oscillator (tanpa file suara), nadanya naik per arah supaya posisi jari terasa.
// Kalau audio belum terbuka kuncinya, bunyinya dilewati saja (tidak diantrekan).
export function playPilihRoda(indeks = 0) {
  if (!efekBoleh()) return
  const ctx = getAudioCtx()
  if (ctx.state !== 'running') {
    ctx.resume?.()
    return
  }
  const mulai = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(520 + indeks * 130, mulai)
  gain.gain.setValueAtTime(0.12, mulai)
  gain.gain.exponentialRampToValueAtTime(0.0001, mulai + 0.05)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(mulai)
  osc.stop(mulai + 0.07)
}

// Nada pendek dengan oscillator, dijadwalkan `t` detik dari sekarang. Dipakai efek suara Spiderman di bawah.
function nadaPendek(ctx, tipe, f0, f1, dur, vol, t, tujuan = ctx.destination) {
  const w = ctx.currentTime + t
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = tipe
  osc.frequency.setValueAtTime(f0, w)
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, w + dur)
  gain.gain.setValueAtTime(0.0001, w)
  gain.gain.exponentialRampToValueAtTime(vol, w + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, w + dur)
  osc.connect(gain)
  gain.connect(tujuan)
  osc.start(w)
  osc.stop(w + dur + 0.03)
}

// Jalur penguat untuk bunyi Spiderman: kompresor merapatkan puncak bunyi, lalu penguat menaikkan volumenya.
// Hasilnya jauh lebih keras dari volume oscillator biasa tanpa pecah di speaker hape.
const busSpidey = new WeakMap()
function jalurSpidey(ctx) {
  let bus = busSpidey.get(ctx)
  if (!bus) {
    const kompresor = ctx.createDynamicsCompressor()
    kompresor.threshold.value = -20
    kompresor.knee.value = 12
    kompresor.ratio.value = 8
    kompresor.attack.value = 0.003
    kompresor.release.value = 0.15
    const penguat = ctx.createGain()
    penguat.gain.value = 3
    kompresor.connect(penguat)
    penguat.connect(ctx.destination)
    bus = kompresor
    busSpidey.set(ctx, bus)
  }
  return bus
}

function ctxSiapEfek() {
  if (!efekBoleh()) return null
  const ctx = getAudioCtx()
  if (ctx.state !== 'running') {
    ctx.resume?.()
    return null
  }
  return ctx
}

// "Whoosh" tembakan jaring saat Spiderman masuk: desis angin yang menyapu naik disertai satu nada tinggi
// yang ikut naik, sekitar 0,5 detik. Dibuat dengan oscillator dan derau (tanpa file suara). Dipanggil
// oleh kartu Spiderman tepat saat badannya mulai terlihat masuk ke kartu.
export function playWhooshMasuk() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  const n = Math.floor(ctx.sampleRate * 0.5)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const sumber = ctx.createBufferSource()
  sumber.buffer = buf
  const saring = ctx.createBiquadFilter()
  saring.type = 'highpass'
  saring.frequency.setValueAtTime(600, ctx.currentTime)
  saring.frequency.exponentialRampToValueAtTime(5500, ctx.currentTime + 0.5)
  const gain = ctx.createGain()
  gain.gain.value = 0.4
  sumber.connect(saring)
  saring.connect(gain)
  gain.connect(jalurSpidey(ctx))
  sumber.start()
  nadaPendek(ctx, 'sine', 700, 2200, 0.42, 0.4, 0.02, jalurSpidey(ctx))
}

// Pesanan dibatalkan: gaya "kalah" game 8-bit. Empat bip kotak menurun lalu satu nada kotak merosot
// ke bawah. Mulai 0,3 detik setelah pembatalan (saat kepala Spiderman tertunduk), selesai sekitar 1,3 detik.
export function playPesananBatal() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  ;[784, 659, 523, 392].forEach((f, i) => nadaPendek(ctx, 'square', f, f, 0.14, 0.09, 0.3 + i * 0.14))
  nadaPendek(ctx, 'square', 330, 90, 0.6, 0.09, 0.3 + 0.6)
}

// Pindah tab dock: letupan derau kecil lalu dua denting tinggi, pas dengan siku cyan yang "menjepit" tab.
export function playTabPindah() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  const n = Math.floor(ctx.sampleRate * 0.04)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const sumber = ctx.createBufferSource()
  sumber.buffer = buf
  const saring = ctx.createBiquadFilter()
  saring.type = 'bandpass'
  saring.frequency.setValueAtTime(3500, ctx.currentTime)
  saring.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.04)
  const gain = ctx.createGain()
  gain.gain.value = 0.14
  sumber.connect(saring)
  saring.connect(gain)
  gain.connect(ctx.destination)
  sumber.start()
  nadaPendek(ctx, 'sine', 1320, 1320, 0.08, 0.1, 0.02)
  nadaPendek(ctx, 'sine', 1760, 1760, 0.1, 0.07, 0.07)
}

// Kursor menyorot tab dock (hanya di perangkat dengan mouse): satu bip kotak mini, sangat pelan.
export function playTabSorot() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'square', 1200, 1200, 0.025, 0.035, 0)
}

// Ketukan lembut tiap angka jam/menit yang lewat di tengah roda pemilih waktu (nada segitiga pendek, tidak tajam).
export function playJamTik() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'triangle', 660, 600, 0.075, 0.09, 0)
  nadaPendek(ctx, 'sine', 1320, 1200, 0.05, 0.03, 0)
}

// ---------- Antrean suara asisten AI ----------
// Tiap rangkaian suara (misal suara laba-laba lalu suara AI) masuk antrean dan
// baru mulai setelah rangkaian sebelumnya SELESAI. Jadi kalau Fajri kirim
// pesanan lalu langsung batal, suara "Request sent..." selesai dulu, baru
// "Request cancelled." berbunyi. Gak numpuk.
const BATAS_ANTREAN = 3 // kalau lebih dari ini lagi nunggu, yang baru dibuang
let ekorAntrean = Promise.resolve()
let sedangMenunggu = 0

function masukAntrean(kerja) {
  if (sedangMenunggu >= BATAS_ANTREAN) return Promise.resolve(false)
  sedangMenunggu++
  const hasil = ekorAntrean
    .then(kerja)
    .catch((err) => {
      console.error('Gagal putar suara:', err)
      return false
    })
    .finally(() => {
      sedangMenunggu--
    })
  ekorAntrean = hasil.then(() => {})
  return hasil
}

const tunggu = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Putar satu suara dan selesai (resolve) begitu suaranya habis. Ada batas
// waktu cadangan, jaga-jaga kalau event 'ended' gak pernah datang.
function putarSampaiSelesai(buffer, denganEfekAi) {
  return new Promise((resolve) => {
    const sumber = denganEfekAi ? putarBufferDenganEfekAi(buffer) : putarBuffer(buffer)
    let selesai = false
    const akhiri = () => {
      if (selesai) return
      selesai = true
      resolve()
    }
    sumber.onended = akhiri
    setTimeout(akhiri, buffer.duration * 1000 + 1000)
  })
}

// Suara asisten AI (voice line) dan suara laba-laba (efek suara), berurutan.
// Kalau salah satu gagal dimuat, yang satunya tetap main.
const JEDA_ANTAR_SUARA_MS = 150

function mainkanDuaSuara(kunci, namaAntrian, labaLabaDulu) {
  if (!efekBoleh()) return Promise.resolve(false)
  return masukAntrean(async () => {
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

    // Mode tanpa-voice: cuma efek suara laba-laba yang bunyi.
    const suaraAi = voiceBoleh() && bufferSuaraAi[kunci] && { buffer: bufferSuaraAi[kunci], efek: true }
    const labaLaba = spiderBuffer && { buffer: spiderBuffer, efek: false }
    const urutan = (labaLabaDulu ? [labaLaba, suaraAi] : [suaraAi, labaLaba]).filter(Boolean)
    if (urutan.length === 0) return false

    for (let i = 0; i < urutan.length; i++) {
      if (i > 0) await tunggu(JEDA_ANTAR_SUARA_MS)
      await putarSampaiSelesai(urutan[i].buffer, urutan[i].efek)
    }
    return true
  })
}

// Suara AI saja, tanpa efek suara laba-laba.
function mainkanSuaraAiSaja(kunci, namaAntrian) {
  if (!voiceBoleh()) return Promise.resolve(false)
  return masukAntrean(async () => {
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

    await putarSampaiSelesai(bufferSuaraAi[kunci], true)
    return true
  })
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
  playMissionSuccess,
  playMisiDiterima,
  playPesanTerkirim,
  playBatalDipencet,
}

// Spiderman disentuh: satu bunyi pendek untuk tiap jenis reaksi (kaget, senang, kenyal, getar, bersin, ngantuk, angguk, glitch, joget, bungee, intip, sense).
const nadaAsli = nadaPendek
export function playSpideySentuh(jenis) {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  // Bunyi reaksi Spiderman dibuat sekitar 3,6x lebih keras dari semula supaya terdengar jelas di hape.
  const nadaPendek = (c, tipe, f0, f1, dur, vol, tunda) => nadaAsli(c, tipe, f0, f1, dur, Math.min(vol * 3.6, 0.55), tunda, jalurSpidey(c))
  if (jenis === 'kaget') {
    nadaPendek(ctx, 'triangle', 880, 1320, 0.07, 0.1, 0)
    nadaPendek(ctx, 'triangle', 1100, 1650, 0.09, 0.08, 0.08)
  } else if (jenis === 'senang') {
    ;[523, 659, 784].forEach((f, i) => nadaPendek(ctx, 'triangle', f, f, 0.08, 0.09, i * 0.08))
  } else if (jenis === 'kenyal') {
    nadaPendek(ctx, 'sine', 260, 640, 0.12, 0.11, 0)
    nadaPendek(ctx, 'sine', 640, 200, 0.2, 0.09, 0.1)
  } else if (jenis === 'bersin') {
    // "ha...": nada naik menahan, lalu "chi!" letupan pendek di saat badan menghentak
    nadaPendek(ctx, 'sine', 380, 900, 0.3, 0.07, 0)
    nadaPendek(ctx, 'square', 1500, 350, 0.09, 0.09, 0.62)
    nadaPendek(ctx, 'triangle', 220, 110, 0.14, 0.1, 0.64)
  } else if (jenis === 'ngantuk') {
    // dengkuran: dua nada rendah yang bergoyang turun
    nadaPendek(ctx, 'sine', 230, 150, 0.55, 0.07, 0.1)
    nadaPendek(ctx, 'triangle', 220, 140, 0.5, 0.05, 0.1)
    nadaPendek(ctx, 'sine', 200, 140, 0.5, 0.06, 1.1)
  } else if (jenis === 'angguk') {
    ;[0, 0.2, 0.4].forEach((t) => nadaPendek(ctx, 'triangle', 520, 480, 0.06, 0.09, t))
    nadaPendek(ctx, 'triangle', 784, 784, 0.12, 0.09, 0.62)
  } else if (jenis === 'glitch') {
    ;[900, 300, 1400, 200, 1100, 400, 1700, 250].forEach((f, i) => nadaPendek(ctx, 'square', f, f, 0.03, 0.05, i * 0.045))
  } else if (jenis === 'joget') {
    ;[392, 523, 392, 659].forEach((f, i) => nadaPendek(ctx, 'triangle', f, f, 0.09, 0.09, i * 0.2))
  } else if (jenis === 'bungee') {
    nadaPendek(ctx, 'sine', 700, 180, 0.3, 0.08, 0)
    nadaPendek(ctx, 'sine', 200, 520, 0.12, 0.1, 0.32)
    nadaPendek(ctx, 'sine', 400, 250, 0.12, 0.08, 0.66)
    nadaPendek(ctx, 'sine', 330, 280, 0.1, 0.06, 0.98)
  } else if (jenis === 'intip') {
    nadaPendek(ctx, 'sine', 300, 1100, 0.2, 0.08, 0)
    nadaPendek(ctx, 'triangle', 700, 700, 0.05, 0.06, 1.0)
    nadaPendek(ctx, 'triangle', 760, 760, 0.05, 0.06, 1.7)
    nadaPendek(ctx, 'sine', 500, 400, 0.15, 0.06, 2.1)
  } else if (jenis === 'sense') {
    // dengung bawah yang membesar ditambah kelip nada tinggi, seperti firasat bahaya
    nadaPendek(ctx, 'sine', 110, 170, 0.7, 0.09, 0)
    ;[1500, 1900, 1550, 2000, 1600, 2100, 1700].forEach((f, i) => nadaPendek(ctx, 'triangle', f, f * 1.05, 0.05, 0.05, 0.05 + i * 0.07))
  } else if (jenis === 'getar') {
    for (let i = 0; i < 7; i++) nadaPendek(ctx, 'square', i % 2 ? 760 : 700, i % 2 ? 760 : 700, 0.03, 0.035, i * 0.045)
  }
}
