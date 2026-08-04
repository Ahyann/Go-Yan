# Go-Yan 🕷️

**Aplikasi ojek pribadi** yang dibangun buat kebutuhan nyata sehari-hari: nganter-jemput sepupu ke kampus/kantor. Dua peran (Ojek & Penumpang), data real-time, live GPS 2 arah, dan tema visual terinspirasi Spider-Man — dibangun dari nol sebagai proyek belajar frontend development.

🔗 **Live demo:** [go-yan.vercel.app](https://go-yan.vercel.app)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?logo=firebase&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)

---

## Kenapa proyek ini dibuat

Ini bukan proyek "clone Gojek" generik — ini beneran dipakai buat koordinasi jemput-antar antara saya (Ojek) dan sepupu saya (Penumpang) tiap minggu. Karena cuma 2 pengguna, saya bisa fokus ke detail pengalaman yang biasanya dikorbankan di proyek besar: animasi halus, feedback real-time, dan UI yang kerasa "hidup".

## Fitur

- **Autentikasi berbasis peran** — 1 akun Ojek, 1 akun Penumpang, tampilan & kemampuan beda total
- **Permintaan perjalanan real-time** — Penumpang kirim "GO" (jemput/antar + lokasi + jam), Ojek terima/tolak, status ke-sync otomatis di kedua sisi tanpa refresh (Firestore listener)
- **GPS live 2 arah** — Ojek bisa share lokasi ke Penumpang saat otw, dan sebaliknya Penumpang bisa share lokasi ke Ojek — ditampilin di peta interaktif (Leaflet + MapTiler)
- **Jadwal mingguan** — Penumpang atur jadwal antar-jemput per hari, otomatis reset tiap Senin, Ojek bisa lihat (read-only)
- **Riwayat & tagihan** — pencatatan tiap perjalanan, status lunas/belum, filter per bulan, dan **swipe-to-delete** buat hapus entri
- **Sound effect & animasi custom** — efek suara & animasi loading kustom (Web Audio API) di momen-momen penting (kirim GO, terima permintaan)
- **PWA installable** — bisa di-"Add to Home Screen" di iPhone, jalan full-screen kayak app native
- **Tema visual custom** — desain gelap terinspirasi Spider-Man (bukan reproduksi logo/karakter berlisensi), font custom, efek glow

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Frontend | React 18, Vite |
| Backend / Data | Firebase Auth, Cloud Firestore (data terstruktur), Realtime Database (GPS live) |
| Peta | React Leaflet + MapTiler |
| Deployment | Vercel |
| Styling | CSS custom (tanpa framework), inline style objects |

## Arsitektur singkat

- **Role-based routing** — 1 komponen `App.jsx` nge-route ke `OjekView` atau `PenumpangView` berdasarkan UID yang login, bukan URL terpisah
- **Firestore buat data terstruktur** (permintaan aktif, riwayat, jadwal), **Realtime Database buat GPS** — dipisah sengaja karena RTDB lebih murah & cepat buat data yang update tiap beberapa detik
- **Custom hooks** buat tiap sumber data (`usePermintaanAktif`, `useRiwayat`, `useJadwalMingguan`, `useLokasiSaya`, dst) — komponen UI gak pernah manggil Firebase langsung
- **State lifted ke `App.jsx`**, diteruskan lewat props — dengan cuma 2 pengguna, ini lebih simpel daripada nambah state management library

## Menjalankan secara lokal

\`\`\`bash
git clone https://github.com/Ahyann/Go-Yan.git
cd Go-Yan
npm install
\`\`\`

Copy \`.env.example\` jadi \`.env\`, isi dengan kredensial Firebase & MapTiler kamu sendiri:

\`\`\`
VITE_FB_API_KEY=
VITE_FB_AUTH_DOMAIN=
VITE_FB_PROJECT_ID=
VITE_FB_STORAGE_BUCKET=
VITE_FB_MESSAGING_SENDER_ID=
VITE_FB_APP_ID=
VITE_FB_DATABASE_URL=
VITE_MAPTILER_KEY=
\`\`\`

\`\`\`bash
npm run dev
\`\`\`

## Roadmap

- [ ] Push notification (Firebase Cloud Messaging)
- [ ] Marker lokasi custom (kantor/kampus/rumah) di peta
- [ ] Perbaikan bug layout iOS terkait keyboard di beberapa kondisi

## Dibuat oleh

**Ahyan Nubaid** — Mahasiswa S1 Informatika, UPN Veteran Jakarta · Frontend Developer, KSM Veteran Tech

Proyek ini dibangun step-by-step dengan bimbingan AI (Claude) sebagai bagian dari proses belajar — dari fondasi React sampai deployment production, termasuk debugging masalah nyata (CSS layout, iOS Safari quirks, integrasi API pihak ketiga).