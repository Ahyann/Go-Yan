# Go-yan

PWA antar-jemput pribadi untuk 2 pengguna: satu pengendara (ojek), satu penumpang.
Menggantikan alur manual WhatsApp (jadwal + share live location) dan catatan Notes (tarif).

## Fitur

- Penumpang mengatur jadwal jemput, sekali atau berulang mingguan
- Pengendara membagikan lokasi langsung; penumpang memantau di peta
- Setiap perjalanan tercatat otomatis Rp32.000
- Halaman tagihan transparan: jumlah perjalanan dan total yang perlu ditransfer

## Teknologi

| Bagian | Pilihan | Alasan |
|---|---|---|
| UI | React + Vite | Build cepat, bundel ringan |
| Peta | Leaflet + OpenStreetMap | Tanpa API key, tanpa biaya |
| Lokasi langsung | Firebase Realtime Database | Latensi rendah untuk data yang sering berubah |
| Jadwal & tagihan | Firestore | Kueri terstruktur |
| Masuk | Firebase Auth | Dua akun tetap |

## Menjalankan di lokal

```bash
npm install
cp .env.example .env   # isi dari Firebase Console
npm run dev
```

## Status

- [x] Fase 0 — pondasi project
- [ ] Fase 1 — tampilan penumpang & ojek
- [ ] Fase 2 — masuk akun
- [ ] Fase 3 — jadwal jemput
- [ ] Fase 4 — lokasi langsung di peta
- [ ] Fase 5 — pencatatan tagihan
- [ ] Fase 6 — tema & pemasangan PWA
- [ ] Fase 7 — notifikasi
