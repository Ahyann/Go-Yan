# Terapkan efek suara asisten AI (gaya radio/megafon) ke semua MP3 mentah di
# folder sumber-suara, hasilnya ditulis ke public/sounds dengan nama yang sama.
#
# Cara pakai:
#   1. Generate suara di Narakeet, simpan MP3-nya di folder sumber-suara
#      (nama file = nama yang dipakai app, misal jarvis_spam.mp3).
#   2. Dari folder project, jalankan:  .\sumber-suara\terapkan-efek.ps1
#   3. git add public/sounds/<nama>.mp3 sumber-suara/<nama>.mp3
#
# File di sumber-suara adalah aslinya (tanpa efek) dan TIDAK ikut ke aplikasi.
# Butuh ffmpeg di PATH.

$ErrorActionPreference = 'Stop'

$akar = Split-Path -Parent $PSScriptRoot
$sumber = Join-Path $akar 'sumber-suara'
$tujuan = Join-Path $akar 'public\sounds'

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw 'ffmpeg tidak ditemukan di PATH. Pasang dulu: winget install Gyan.FFmpeg'
}

# Efek "radio ringan" (versi C yang diringankan supaya ucapan tetap jelas):
# - nada turun sekitar 1 nada, durasi tetap
# - band-pass 300-3400 Hz (kesan radio, tapi konsonan 1.5-4.5 kHz tetap kebawa)
#   plus dorongan di 600 Hz (badan suara) dan 2500 Hz (kejelasan ucapan)
# - gema pendek tipis (8 ms dan 90 ms)
# - stereo tipis (kanan ditunda 14 ms)
# Versi C sebelumnya (band 350-2000 Hz, gema 4 tingkat) bikin pengucapan
# gak kedengeran, karena energi konsonan turun ke ~3.5% (aslinya 6.3%).
$rate = 0.9439
$balik = [math]::Round(1 / $rate, 4)
$filter = "aresample=48000,asetrate=48000*$rate,aresample=48000,atempo=$balik," +
  'highpass=f=300:p=2,lowpass=f=3400:p=2,' +
  'equalizer=f=600:t=q:w=1.2:g=2.5,equalizer=f=2500:t=q:w=1.0:g=3,' +
  'aecho=0.8:0.85:8|90:0.2|0.15,' +
  'aformat=channel_layouts=stereo,haas=level_in=1:level_out=1:right_delay=14:left_delay=0,' +
  'alimiter=limit=0.9,volume=1.4,alimiter=limit=0.95'

$files = Get-ChildItem -Path $sumber -Filter '*.mp3'
if (-not $files) { throw "Tidak ada .mp3 di $sumber" }

foreach ($f in $files) {
  $keluar = Join-Path $tujuan $f.Name
  Write-Host "Memproses $($f.Name) -> public\sounds\$($f.Name)"
  & ffmpeg -v error -y -i $f.FullName -af $filter -ar 44100 -b:a 192k $keluar
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg gagal untuk $($f.Name)" }
}
Write-Host 'Selesai.'
