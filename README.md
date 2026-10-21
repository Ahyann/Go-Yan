# Go-Yan 

**Aplikasi ojek pribadi** yang dibangun buat kebutuhan nyata sehari-hari: nganter-jemput sepupu ke kampus/kantor. Dua peran (Ojek & Penumpang), data real-time, live GPS 2 arah, dan tema visual terinspirasi Spider-Man. Dibangun dari nol sebagai proyek belajar frontend development.

🔗 **Live demo:** [go-yan.vercel.app](https://go-yan.vercel.app)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?logo=firebase&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)

---

## Kenapa proyek ini dibuat

Ini bukan proyek "clone Gojek" generik, ini beneran dipakai buat koordinasi jemput-antar antara saya (Ojek) dan sepupu saya (Penumpang) tiap minggu. Karena cuma 2 pengguna, saya bisa fokus ke detail pengalaman yang biasanya dikorbankan di proyek besar: animasi halus, feedback real-time, dan UI yang kerasa "hidup".

## Fitur

- **Autentikasi berbasis peran**: 1 akun Ojek, 1 akun Penumpang, tampilan & kemampuan beda total
- **Permintaan perjalanan real-time**: Penumpang kirim "GO" (jemput/antar + lokasi + jam), Ojek terima/tolak, status ke-sync otomatis di kedua sisi tanpa refresh (Firestore listener)
- **GPS live 2 arah**: Ojek bisa share lokasi ke Penumpang saat otw, dan sebaliknya Penumpang bisa share lokasi ke Ojek, ditampilin di peta interaktif (Leaflet + MapTiler)
- **Push notification**: notifikasi tetap masuk walau app ketutup (Firebase Cloud Messaging), plus popup in-app kalau lagi buka app di tab lain
- **Jadwal mingguan**: Penumpang atur jadwal antar-jemput per hari, otomatis reset tiap Sabtu jam 12, Ojek bisa lihat & tandai selesai
- **Riwayat & tagihan**: pencatatan tiap perjalanan, status lunas/belum, filter per bulan, dan **swipe-to-delete** buat hapus entri
- **Status peta yang hidup**: badge status (siap jalan, ditolak, diterima) pake animasi ketik dan icon profil yang bisa diganti-ganti
- **Chat di peta**: pesan muncul sebagai bubble pixel-art di atas karakter masing-masing, bisa teks atau **foto** (diambil langsung dari kamera di dalam app, dikompres di HP, tampil 4:3 di dalam bingkai bubble)
- **Quick chat**: tahan karakter sendiri di peta, geser ke pesan yang mau dikirim di roda, lepas buat kirim
- **Suara asisten AI**: voice line bergaya radio di momen penting (terima misi, kirim pesanan, batal), diputar bergiliran dengan efek suara lewat Web Audio API, dan ada **mode suara** (normal, tanpa voice over, senyap) di halaman Akun
- **Sound effect & animasi custom**: efek suara & animasi kustom (Web Audio API) di momen-momen penting (kirim GO, terima permintaan, chat)
- **PWA installable**: bisa di-"Add to Home Screen" di iPhone/Android, jalan full-screen kayak app native
- **Dwibahasa**: full Indonesia/English lewat toggle di halaman Akun, dan juga di halaman login
- **Mode demo**: bisa dicoba tanpa akun (masuk sebagai Driver atau Penumpang), datanya terpisah dari akun asli, dengan pop up sambutan yang ngejelasin cara nyobainnya
- **Tema visual custom**: desain gelap terinspirasi Spider-Man (bukan reproduksi logo/karakter berlisensi), font custom, efek glow

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Frontend | React 18, Vite |
| Backend / Data | Firebase Auth, Cloud Firestore (data terstruktur), Realtime Database (GPS live) |
| Peta | React Leaflet + MapTiler |
| Deployment | Vercel |
| Styling | CSS custom (tanpa framework), inline style objects |

## Arsitektur singkat

- **Role-based routing**: 1 komponen `App.jsx` nge-route ke `OjekView` atau `PenumpangView` berdasarkan UID yang login, bukan URL terpisah
- **Firestore buat data terstruktur** (permintaan aktif, riwayat, jadwal), **Realtime Database buat GPS**, dipisah sengaja karena RTDB lebih murah & cepat buat data yang update tiap beberapa detik
- **Custom hooks** buat tiap sumber data (`usePermintaanAktif`, `useRiwayat`, `useJadwalMingguan`, `useLokasiSaya`, dst), komponen UI gak pernah manggil Firebase langsung
- **State lifted ke `App.jsx`**, diteruskan lewat props. Dengan cuma 2 pengguna, ini lebih simpel daripada nambah state management library

## Menjalankan secara lokal

```bash
git clone https://github.com/Ahyann/Go-Yan.git
cd Go-Yan
npm install
```

Copy `.env.example` jadi `.env`, isi dengan kredensial Firebase & MapTiler kamu sendiri:

```
VITE_FB_API_KEY=
VITE_FB_AUTH_DOMAIN=
VITE_FB_PROJECT_ID=
VITE_FB_STORAGE_BUCKET=
VITE_FB_MESSAGING_SENDER_ID=
VITE_FB_APP_ID=
VITE_FB_DATABASE_URL=
VITE_MAPTILER_KEY=
```

```bash
npm run dev
```

## Roadmap

### Fitur yang direncanain

- [ ] **Level up akun Ojek**: naik level tiap total pendapatan nambah Rp500.000
- [ ] **Level up akun Penumpang**: dapet reward kosmetik, kemungkinan juga diskon (mekanisme naik level dan bentuk rewardnya belum ditentuin)
- [ ] **History chat**: riwayat percakapan Ojek dan Penumpang
- [ ] **Deteksi spam GO/batal**: kalau terlalu sering (3 aksi dalam 10 detik), ada suara peringatan dan tombol GO ditahan sebentar
- [ ] **Efek suara di tiap tombol** ala game
- [ ] **Posisi bubble otomatis**: bubble pindah sisi kalau nutupin karakter lawan atau mepet tepi layar
- [ ] Voice line tambahan: pesanan diterima, ditolak, live location nyala, perjalanan selesai
- [ ] **Tema kedua "Pixel Modern (Spider-Man)"** dan pilihan ganti tema di halaman Settings (desain dibuat dulu; warna sebagian besar udah lewat CSS variables dan `--font-pixel` udah disiapin)
- [ ] **Marker lokasi custom** (kantor/kampus/rumah) tambahan di peta (draft datanya ada di `src/lib/lokasiPOI.js`, belum dipakai)
- [ ] Eksplorasi pakai komponen UI dari library berbasis TSX (perlu dikonversi ke JSX, dan dicek apakah butuh Tailwind)

### Perbaikan teknis

- [ ] Konfirmasi final security rules Firestore dan Realtime Database (disetting di Firebase Console, bukan di repo)
- [ ] Suara pengingat keberangkatan masih pakai bunyi chat sementara (belum ada file khusus)
- [ ] Pantau rilis `firebase-admin` buat nutup 10 vulnerability level moderate dari `uuid` (`npm audit`)

### Selesai

- [x] Perbaikan bug layout iOS terkait keyboard di beberapa kondisi
- [x] Code splitting buat ngecilin ukuran bundle production
- [x] Mode demo terisolasi dari data akun utama
- [x] Ganti icon profil dan warna glow buat Ojek dan Penumpang
- [x] Atur jadwal sendiri dari akun Ojek
- [x] Quick chat dengan tahan karakter di peta
- [x] Kirim foto di chat, tampil sebagai bubble 4:3 bertema pixel-art
- [x] Suara asisten AI dan pengaturan mode suara
- [x] Pop up sambutan di mode demo dan pilihan bahasa di halaman login
- [x] Hapus dependency `react-router-dom` yang udah gak dipakai

## Dibuat oleh

**Ahyan Nubaid**, Mahasiswa S1 Informatika, UPN Veteran Jakarta. Frontend Developer, KSM Veteran Tech.

Proyek ini dibangun step-by-step dengan bimbingan AI (Claude) sebagai bagian dari proses belajar, dari fondasi React sampai deployment production, termasuk debugging masalah nyata (CSS layout, iOS Safari quirks, integrasi API pihak ketiga).
