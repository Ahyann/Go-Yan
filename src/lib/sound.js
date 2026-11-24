// ---------- Mode suara (pengaturan per perangkat) ----------
// normal: semua bunyi. tanpa-voice: efek suara tetap ada, voice over asisten AI
// mati. senyap: gak ada suara sama sekali dari app (suara notifikasi dari HP
// diatur sistem HP, bukan app).
export const MODE_SUARA = { NORMAL: 'normal', TANPA_VOICE: 'tanpa-voice', SENYAP: 'senyap' }
const KUNCI_MODE_SUARA = 'goyan-mode-suara'

function bacaModeSuara() {
  try {
    // Pilihan "dengan voice over" sudah dihapus dari pengaturan: yang dulu memilihnya ikut jadi tanpa voice
    const tersimpan = localStorage.getItem(KUNCI_MODE_SUARA)
    return tersimpan === MODE_SUARA.SENYAP ? MODE_SUARA.SENYAP : MODE_SUARA.TANPA_VOICE
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
  if (mode !== MODE_SUARA.TANPA_VOICE && mode !== MODE_SUARA.SENYAP) return
  modeSuara = mode
  try {
    localStorage.setItem(KUNCI_MODE_SUARA, mode)
  } catch {
    // penyimpanan diblokir, pilihan cuma berlaku sampai app ditutup
  }
  if (mode === MODE_SUARA.SENYAP) suaraTertunda = null // jangan bunyi nanti pas layar disentuh
  pendengarMode.forEach((fungsi) => fungsi())
}

// Setiap fungsi suara memeriksa efekBoleh atau voiceBoleh paling dulu. Waktunya dicatat supaya bunyi klik umum
// (di bawah) tahu kalau tombol yang baru ditekan sudah punya bunyi sendiri, lalu tidak ikut berbunyi dua kali.
let suaraTerakhir = -1e9
const efekBoleh = () => {
  suaraTerakhir = performance.now()
  return modeSuara !== MODE_SUARA.SENYAP
}
const voiceBoleh = () => {
  suaraTerakhir = performance.now()
  return modeSuara === MODE_SUARA.NORMAL
}

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

// Keluaran dengan pengatur volume. volume 1 = langsung ke speaker, kurang dari 1 = lebih pelan.
function keluaranVolume(ctx, volume) {
  if (volume === 1) return ctx.destination
  const g = ctx.createGain()
  g.gain.value = volume
  g.connect(ctx.destination)
  return g
}

function putarBufferDenganEfekAi(buffer, volume = 1) {
  const ctx = getAudioCtx()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  sambungkanEfekAi(ctx, source, keluaranVolume(ctx, volume))
  source.start(0)
  return source
}

function putarBuffer(buffer, volume = 1) {
  const ctx = getAudioCtx()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(keluaranVolume(ctx, volume))
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
  gain.gain.setValueAtTime(0.45, mulai)
  gain.gain.exponentialRampToValueAtTime(0.0001, mulai + 0.09)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(mulai)
  osc.stop(mulai + 0.11)
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

// Jalur penguat untuk bunyi Spiderman: penguat 6x lebih dulu, lalu pembatas (kompresor keras) di ujung supaya
// bunyi bisa naik sampai batas maksimum speaker tanpa pecah.
const busSpidey = new WeakMap()
function jalurSpidey(ctx) {
  let bus = busSpidey.get(ctx)
  if (!bus) {
    const penguat = ctx.createGain()
    penguat.gain.value = 6
    const pembatas = ctx.createDynamicsCompressor()
    pembatas.threshold.value = -3
    pembatas.knee.value = 0
    pembatas.ratio.value = 20
    pembatas.attack.value = 0.001
    pembatas.release.value = 0.1
    penguat.connect(pembatas)
    pembatas.connect(ctx.destination)
    bus = penguat
    busSpidey.set(ctx, bus)
  }
  return bus
}

// Untuk ketukan pertama setelah app dibuka: audio masih "tidur" (suspended), dan efek yang dibunyikan saat itu
// langsung dilewati. Fungsi ini membangunkan audio dulu, lalu menjalankan efeknya begitu audio siap.
export function bunyikanSetelahSiap(fn) {
  if (!efekBoleh()) return
  const ctx = getAudioCtx()
  if (ctx.state === 'running') fn()
  else Promise.resolve(ctx.resume?.()).then(() => fn()).catch(() => {})
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
  // Volume dinaikkan dari 0,09 ke 0,24 (sekitar 8 dB lebih keras) karena bunyi batal terdengar terlalu pelan.
  ;[784, 659, 523, 392].forEach((f, i) => nadaPendek(ctx, 'square', f, f, 0.14, 0.24, 0.3 + i * 0.14))
  nadaPendek(ctx, 'square', 330, 90, 0.6, 0.24, 0.3 + 0.6)
}

// Pindah tab dock: satu denting tinggi yang pendek.
export function playTabPindah() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'sine', 1320, 1320, 0.09, 0.11, 0)
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
function putarSampaiSelesai(buffer, denganEfekAi, volume = 1) {
  return new Promise((resolve) => {
    const sumber = denganEfekAi ? putarBufferDenganEfekAi(buffer, volume) : putarBuffer(buffer, volume)
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

function mainkanDuaSuara(kunci, namaAntrian, labaLabaDulu, volume = 1) {
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
      await putarSampaiSelesai(urutan[i].buffer, urutan[i].efek, volume)
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
// Volume 0,45: bunyi GO terkirim (suara AI + suara laba-laba) terasa terlalu keras pada volume penuh.
export const playPesanTerkirim = () => mainkanDuaSuara('pesan', 'playPesanTerkirim', true, 0.45)

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
  const nadaPendek = (c, tipe, f0, f1, dur, vol, tunda) => nadaAsli(c, tipe, f0, f1, dur, Math.min(vol * 5, 0.9), tunda, jalurSpidey(c))
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

// Pop up ganti karakter dan warna profil. Semua bunyi pendek dan ringan (oscillator, tanpa file suara).
// Dibuka: dua nada naik cepat. Digeser: ketukan kecil, nadanya naik ke kanan dan turun ke kiri.
// Warna: denting yang nadanya mengikuti urutan warna. Disimpan: tiga nada naik. Dibatalkan: dua nada turun.
export function playGantiBuka() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'triangle', 440, 660, 0.09, 0.12, 0)
  nadaPendek(ctx, 'triangle', 660, 990, 0.12, 0.12, 0.08)
}

export function playGantiGeser(arah = 1) {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  const f = arah > 0 ? 620 : 520
  nadaPendek(ctx, 'square', f, f * 1.35, 0.06, 0.07, 0)
  nadaPendek(ctx, 'triangle', f * 2, f * 2.4, 0.08, 0.06, 0.03)
}

const NADA_WARNA = [523, 587, 659, 784, 880, 988]
export function playGantiWarna(indeks = 0) {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  const f = NADA_WARNA[indeks % NADA_WARNA.length]
  nadaPendek(ctx, 'sine', f, f, 0.22, 0.16, 0)
  nadaPendek(ctx, 'triangle', f * 2, f * 2, 0.14, 0.07, 0.02)
}

export function playGantiSimpan() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  ;[523, 659, 784].forEach((f, i) => nadaPendek(ctx, 'triangle', f, f, 0.12, 0.14, i * 0.08))
  nadaPendek(ctx, 'sine', 1047, 1047, 0.3, 0.1, 0.26)
}

export function playGantiBatal() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'triangle', 520, 400, 0.1, 0.1, 0)
  nadaPendek(ctx, 'triangle', 400, 300, 0.14, 0.1, 0.08)
}

// Bunyi klik umum untuk semua tombol. Tombol yang sudah punya bunyi sendiri tidak diganti: kalau ada bunyi lain
// yang baru saja diputar (handler tombolnya jalan lebih dulu dari pendengar ini), bunyi umum dilewati.
// Tombol bisa menolak dengan atribut data-tanpa-suara.
const PILIHAN_KLIK = 'button, a, summary, [role="button"], [role="radio"], [role="tab"], [role="switch"], input[type="checkbox"], input[type="radio"], input[type="submit"]'

// keras: tombol di dalam area yang ditandai data-suara-keras (Home akun penumpang: peta dan kartunya) bunyinya lebih besar
function playKlikTombol(jenis, keras = false) {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  const v = keras ? 0.3 : 0.09
  if (jenis === 'pilih') {
    nadaPendek(ctx, 'triangle', 660, 660, 0.05, v, 0)
    nadaPendek(ctx, 'triangle', 880, 880, 0.07, v, 0.045)
  } else {
    nadaPendek(ctx, 'triangle', 900, 700, 0.06, v, 0)
  }
}

if (typeof document !== 'undefined') {
  // Fase capture: popup yang memakai stopPropagation (misalnya pop up GO) tidak bisa memutus pendengar ini.
  // Karena capture berjalan sebelum handler tombol, keputusan ditunda sesaat (setTimeout 0): kalau sampai saat itu
  // ada bunyi lain yang diputar oleh tombolnya, bunyi umum dilewati.
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target?.closest?.(PILIHAN_KLIK)
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('data-tanpa-suara')) return
      if (el.closest('[data-tanpa-suara]')) return
      const tKlik = performance.now()
      const keras = !!el.closest('[data-suara-keras]')
      const pilihan = el.matches('[role="radio"], [role="switch"], input[type="checkbox"], input[type="radio"]') || el.hasAttribute('aria-pressed') || el.hasAttribute('aria-checked')
      setTimeout(() => {
        if (suaraTerakhir >= tKlik) return
        playKlikTombol(pilihan ? 'pilih' : 'tap', keras)
      }, 0)
    },
    { passive: true, capture: true }
  )
}

// Konsol ojek saat misi baru masuk: tiga bip alarm pendek bergantian tinggi-rendah, seirama dengan
// tepi konsol yang berkedip merah tiga kali, lalu satu desis kotak pendek saat isi muncul dengan efek glitch.
export function playKonsolAlarm() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  ;[0, 0.32, 0.64].forEach((t) => {
    nadaPendek(ctx, 'square', 1046, 1046, 0.1, 0.09, t)
    nadaPendek(ctx, 'square', 784, 784, 0.1, 0.07, t + 0.12)
  })
  nadaPendek(ctx, 'square', 220, 1600, 0.12, 0.05, 1.0)
}

// Konsol ojek saat misi ditolak atau dibatalkan: layar "dimatikan" dengan satu nada kotak yang jatuh cepat,
// mengiringi isi konsol yang terpotong-potong lalu hilang. Pendek dan pelan karena bunyi batal utama sudah ada.
export function playKonsolMati() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'square', 1500, 160, 0.28, 0.06, 0)
  nadaPendek(ctx, 'sawtooth', 700, 90, 0.2, 0.04, 0.08)
}

// Semua trip dilunaskan lewat bar tahan di konsol History: tiga nada naik (do-mi-sol) dan satu kilau tinggi, selaras dengan ceklis yang tergambar
export function playLunasSemua() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  ;[523, 659, 784].forEach((f, i) => nadaPendek(ctx, 'square', f, f, 0.12, 0.08, i * 0.09))
  nadaPendek(ctx, 'triangle', 1568, 1568, 0.35, 0.07, 0.3)
}

// Tombol kamera di konsol ojek: dua klik pendek seperti rana kamera
export function playTombolKamera(keras = false) {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  const v = keras ? 0.26 : 0.08
  nadaPendek(ctx, 'square', 1800, 600, 0.04, v, 0)
  nadaPendek(ctx, 'square', 1400, 300, 0.05, v, 0.07)
}

// Tombol suara di konsol ojek: satu nada naik seperti mikrofon menyala
export function playTombolSuara() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'triangle', 440, 880, 0.12, 0.12, 0)
  nadaPendek(ctx, 'square', 1320, 1320, 0.04, 0.05, 0.12)
}

// Geser selesai: satu tik pendek tiap 10% jarak geser, nadanya naik makin dekat ke ujung.
// Kalau digeser pelan, tiknya terdengar satu per satu; kalau ditarik balik, nadanya turun lagi.
export function playGeserTik(langkah = 0) {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  const f = 380 + langkah * 90
  nadaPendek(ctx, 'square', f, f, 0.035, 0.07, 0)
}

// Geser deretan jam cuaca: tik sine sangat pendek dan pelan, tidak mengganggu
export function playGeserHalus() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'sine', 1300, 1300, 0.025, 0.03, 0)
}

// Notifikasi pil pesanan baru (saat di tab lain): dua nada kaca bening yang naik, pendek dan lembut
export function playNotifPil() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'sine', 1046, 1046, 0.16, 0.16, 0)
  nadaPendek(ctx, 'sine', 1568, 1568, 0.22, 0.14, 0.09)
  nadaPendek(ctx, 'triangle', 2093, 2093, 0.12, 0.04, 0.09)
}

// Riwayat dihapus: satu desis "swoosh" pendek yang turun saat kartu meluncur keluar ke kiri
export function playHapusGeser() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  const lama = 0.28
  const n = Math.floor(ctx.sampleRate * lama)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / n)
  const sumber = ctx.createBufferSource()
  sumber.buffer = buf
  const saring = ctx.createBiquadFilter()
  saring.type = 'bandpass'
  saring.Q.value = 1.2
  saring.frequency.setValueAtTime(2600, ctx.currentTime)
  saring.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + lama)
  const gain = ctx.createGain()
  gain.gain.value = 0.35
  sumber.connect(saring)
  saring.connect(gain)
  gain.connect(ctx.destination)
  sumber.start()
}

// Sambutan konsol ojek saat app dibuka: empat nada naik pendek seperti layar menyala
export function playSambutKonsol() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  ;[523, 659, 784, 1046].forEach((f, i) => nadaPendek(ctx, 'square', f, f, 0.08, 0.06, i * 0.09))
}

// Sambutan simpel: satu nada jernih yang memudar. Dipakai saat halaman login terbuka dan saat masuk akun demo.
export function playTingMasuk() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'sine', 1318, 1318, 0.45, 0.12, 0)
}

// Glitch sambutan konsol: tiga desis kotak acak pendek
export function playSambutGlitch() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'square', 1800, 200, 0.05, 0.06, 0)
  nadaPendek(ctx, 'sawtooth', 300, 1400, 0.05, 0.05, 0.06)
  nadaPendek(ctx, 'square', 2200, 600, 0.04, 0.05, 0.12)
}

// Pop up GO: dibuka dengan dua nada naik seperti sinyal radio, ditutup dengan satu nada turun.
export function playGoBuka() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'square', 520, 780, 0.07, 0.07, 0)
  nadaPendek(ctx, 'triangle', 780, 1170, 0.1, 0.1, 0.07)
}

export function playGoTutup() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'triangle', 780, 520, 0.08, 0.09, 0)
  nadaPendek(ctx, 'square', 520, 340, 0.1, 0.06, 0.06)
}

// ===== Level ojek =====

// Desis angin menyapu naik (derau yang disaring), dipakai sebagai lapisan di beberapa suara level
function desisNaik(ctx, lama, vol, t = 0, dari = 500, ke = 6000) {
  const n = Math.floor(ctx.sampleRate * lama)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / n)
  const sumber = ctx.createBufferSource()
  sumber.buffer = buf
  const saring = ctx.createBiquadFilter()
  saring.type = 'bandpass'
  saring.Q.value = 1.4
  const w = ctx.currentTime + t
  saring.frequency.setValueAtTime(dari, w)
  saring.frequency.exponentialRampToValueAtTime(ke, w + lama)
  const gain = ctx.createGain()
  gain.gain.value = vol
  sumber.connect(saring)
  saring.connect(gain)
  gain.connect(ctx.destination)
  sumber.start(w)
}

// Garis level terisi pelan (sekitar 1,1 detik): nada naik halus ditambah tik-tik yang makin tinggi
export function playLevelIsi() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'triangle', 220, 988, 1.0, 0.09, 0)
  nadaPendek(ctx, 'square', 440, 1760, 1.0, 0.025, 0)
  for (let i = 0; i < 9; i++) nadaPendek(ctx, 'square', 600 + i * 110, 600 + i * 110, 0.03, 0.035, 0.1 + i * 0.11)
}

// NAIK LEVEL: dentuman rendah, desis naik, arpeggio cepat, akor panjang dengan bass, lalu kilau di atasnya (sekitar 2 detik)
export function playLevelNaik() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'sine', 150, 38, 0.5, 0.24, 0)
  nadaPendek(ctx, 'sawtooth', 90, 30, 0.32, 0.06, 0)
  desisNaik(ctx, 0.55, 0.25, 0, 400, 7000)
  ;[523, 659, 784, 1046, 1318, 1568].forEach((f, i) => nadaPendek(ctx, 'square', f, f, 0.13, 0.06, 0.12 + i * 0.08))
  const akor = 0.7
  ;[1046, 1318, 1568, 2093].forEach((f) => nadaPendek(ctx, 'triangle', f, f, 1.2, 0.07, akor))
  nadaPendek(ctx, 'triangle', 131, 131, 1.3, 0.13, akor)
  nadaPendek(ctx, 'sine', 262, 262, 1.3, 0.08, akor)
  ;[2637, 3136, 3951, 4186].forEach((f, i) => nadaPendek(ctx, 'sine', f, f, 0.2, 0.035, akor + 0.15 + i * 0.1))
}

// Piala masuk di layar kedua: desis pendek yang naik lalu satu "ting"
export function playPialaMasuk() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  desisNaik(ctx, 0.35, 0.22, 0, 700, 5000)
  nadaPendek(ctx, 'triangle', 660, 1320, 0.3, 0.07, 0.05)
  nadaPendek(ctx, 'sine', 2093, 2093, 0.4, 0.05, 0.4)
}

// Angka mencapai target (YOU REACHED): tangga nada cepat naik, akor besar yang panjang, kilau di atasnya
export function playLevelTercapai() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'sine', 120, 45, 0.35, 0.2, 0)
  ;[784, 988, 1175, 1568].forEach((f, i) => nadaPendek(ctx, 'square', f, f, 0.11, 0.06, i * 0.07))
  const akor = 0.34
  ;[784, 988, 1175, 1568].forEach((f) => nadaPendek(ctx, 'triangle', f, f, 1.0, 0.07, akor))
  nadaPendek(ctx, 'triangle', 196, 196, 1.1, 0.12, akor)
  ;[2349, 2960, 3136].forEach((f, i) => nadaPendek(ctx, 'sine', f, f, 0.18, 0.035, akor + 0.12 + i * 0.09))
}

// Ketuk untuk lanjut di layar naik level: dua nada naik cepat ("ba-ding") dan desis yang turun saat layar menutup
export function playLevelLanjut() {
  const ctx = ctxSiapEfek()
  if (!ctx) return
  nadaPendek(ctx, 'square', 660, 990, 0.09, 0.06, 0)
  nadaPendek(ctx, 'triangle', 1320, 1980, 0.16, 0.06, 0.07)
  desisNaik(ctx, 0.25, 0.12, 0.04, 3000, 600)
}

// Musik layar piala naik level ("Lonceng + pixel", 124 bpm, 4 birama diulang): melodi lonceng lembut, arpeggio kotak,
// bass, dan drum ringan. Masuk pelan (1,2 dtk) setelah fanfare dan berhenti pelan saat layar diketuk.
const NOTA = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const frekNota = (n) => {
  const m = /^([A-G])(#?)(\d)$/.exec(n)
  return 440 * 2 ** ((NOTA[m[1]] + (m[2] ? 1 : 0) + (+m[3] + 1) * 12 - 69) / 12)
}
const MUSIK_MELODI = [
  'C6 - C6 - D6 - E6 - G6 - - - E6 - - -',
  'B5 - B5 - C6 - D6 - G6 - - - D6 - - -',
  'A5 - A5 - B5 - C6 - E6 - - - C6 - - -',
  'F6 - E6 - D6 - C6 - D6 - E6 - C6 - - -',
].map((b) => b.split(' '))
const MUSIK_BASS = ['C3', 'G2', 'A2', 'F2']
const MUSIK_AKOR = [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4']]
const MUSIK_POLA_BASS = 'x.o.x.o.x.o.x.o.'
const MUSIK_POLA_DRUM = 'k.h.s.h.k.h.s.hs'

function desisMusik(ctx, tujuan, lama, vol, t, dari, ke) {
  const n = Math.floor(ctx.sampleRate * lama)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / n)
  const sumber = ctx.createBufferSource()
  sumber.buffer = buf
  const saring = ctx.createBiquadFilter()
  saring.type = 'bandpass'
  saring.Q.value = 1.4
  const w = ctx.currentTime + t
  saring.frequency.setValueAtTime(dari, w)
  saring.frequency.exponentialRampToValueAtTime(ke, w + lama)
  const gain = ctx.createGain()
  gain.gain.value = vol
  sumber.connect(saring)
  saring.connect(gain)
  gain.connect(tujuan)
  sumber.start(w)
}

function langkahMusik(ctx, tujuan, i, t, d) {
  const bar = (i >> 4) % 4
  const st = i % 16
  const nm = MUSIK_MELODI[bar][st]
  if (nm !== '-') nadaPendek(ctx, 'sine', frekNota(nm), frekNota(nm), d * 2.5, 0.07, t, tujuan)
  if (st % 2 === 0) {
    const f = frekNota(MUSIK_AKOR[bar][[0, 1, 2, 1][(i / 2) % 4 | 0] % 3])
    nadaPendek(ctx, 'square', f, f, d * 2, 0.013, t, tujuan)
  }
  const pb = MUSIK_POLA_BASS[st]
  if (pb === 'x' || pb === 'o') {
    const f = frekNota(MUSIK_BASS[bar]) * (pb === 'o' ? 2 : 1)
    nadaPendek(ctx, 'triangle', f, f, d * 3, 0.1, t, tujuan)
  }
  const dr = MUSIK_POLA_DRUM[st]
  if (dr === 'k') nadaPendek(ctx, 'sine', 110, 45, 0.2, 0.14, t, tujuan)
  else if (dr === 's') desisMusik(ctx, tujuan, 0.09, 0.05, t, 2000, 4500)
  else if (dr === 'h') desisMusik(ctx, tujuan, 0.03, 0.03, t, 6000, 7500)
}

let musikLevel = null

export function playMusikLevel() {
  stopMusikLevel()
  const ctx = ctxSiapEfek()
  if (!ctx) return
  const master = ctx.createGain()
  const sekarang = ctx.currentTime
  master.gain.setValueAtTime(0.0001, sekarang)
  master.gain.exponentialRampToValueAtTime(1, sekarang + 1.2)
  master.connect(ctx.destination)
  const d = 60 / 124 / 4
  let langkah = 0
  let berikut = sekarang + 0.05
  const timer = setInterval(() => {
    while (berikut < ctx.currentTime + 0.2) {
      langkahMusik(ctx, master, langkah, Math.max(0, berikut - ctx.currentTime), d)
      langkah++
      berikut += d
    }
  }, 25)
  musikLevel = { ctx, master, timer }
}

export function stopMusikLevel() {
  if (!musikLevel) return
  const { ctx, master, timer } = musikLevel
  musikLevel = null
  clearInterval(timer)
  const w = ctx.currentTime
  master.gain.cancelScheduledValues(w)
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), w)
  master.gain.exponentialRampToValueAtTime(0.0001, w + 0.3)
  setTimeout(() => master.disconnect(), 500)
}
