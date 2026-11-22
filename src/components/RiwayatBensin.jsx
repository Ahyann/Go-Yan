import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { hapusIsiBensin, ubahIsiBensin, useRiwayatBensin } from '../lib/bensin'
import SwipeableItem from './SwipeableItem.jsx'

const TEKS = {
  id: {
    untukMisi: 'Bensin untuk misi', isiBensin: 'Isi bensin (semua pemakaian)', trip: 'trip', km: 'km', kali: 'kali isi', grafik: 'Bensin untuk misi per minggu',
    catatan: 'Catatan isi bensin', kosongCatatan: 'Belum ada catatan isi bensin bulan ini. Ketuk CATAT ISI di halaman bensin setelah mengisi.',
    ubahIsi: 'Ubah catatan isi', nominal: 'Nominal (Rp)', ketUbah: 'Liter dihitung ulang dari nominal. Sisa bensin di halaman utama tidak berubah.', batal: 'Batal', simpan: 'Simpan',
    isi: 'Isi bensin', penuh: 'Isi penuh', porsi: 'Porsi yang terlacak sebagai misi', porsiKet: 'dari bensin yang kamu beli bulan ini. Sisanya: pemakaian pribadi + misi tanpa live location', minggu: 'M',
    bln: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  },
  en: {
    untukMisi: 'Fuel for missions', isiBensin: 'Fuel bought (all use)', trip: 'trips', km: 'km', kali: 'fill-ups', grafik: 'Fuel for missions per week',
    catatan: 'Fill-up log', kosongCatatan: 'No fill-ups logged this month. Tap LOG FILL on the fuel page after refueling.',
    ubahIsi: 'Edit fill-up', nominal: 'Amount (Rp)', ketUbah: 'Liters are recalculated from the amount. The fuel level on the main page stays the same.', batal: 'Cancel', simpan: 'Save',
    isi: 'Fill-up', penuh: 'Full tank', porsi: 'Share tracked as missions', porsiKet: 'of the fuel you bought this month. The rest: personal use + missions without live location', minggu: 'W',
    bln: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
}

const rupiah = (n) => Math.round(n).toLocaleString('id-ID')
const desimal = (n, d = 1) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })

// Layar Bensin di tab History ojek (sakelar Trip | Bensin): ringkasan bulan, grafik per minggu, dan catatan isi bensin.
// Hanya dipakai di akun ojek; datanya ada di Firestore jalur khusus ojek.
export default function RiwayatBensin({ bulan, tahun }) {
  const { lang } = useLanguage()
  const k = TEKS[lang] || TEKS.id
  const r = useRiwayatBensin(bulan, tahun)
  const maks = Math.max(1, ...r.perMinggu)
  const terboros = r.perMinggu.indexOf(Math.max(...r.perMinggu))
  const adaData = r.jumlahTrip > 0
  const [itemEdit, setItemEdit] = useState(null)
  const [nominal, setNominal] = useState('')

  function simpan() {
    const n = parseInt(nominal, 10)
    if (!n || !itemEdit) return
    ubahIsiBensin(itemEdit, n)
    setItemEdit(null)
  }

  return (
    <div style={s.wrap}>
      <div style={s.baris}>
        <section style={s.kartu}>
          <div style={s.label}>{k.untukMisi}</div>
          <div style={{ ...s.angka, color: '#FF9A3C' }}>±Rp {rupiah(r.rupiah)}</div>
          <div style={s.sub}>{r.jumlahTrip} {k.trip} · {desimal(r.km, 0)} {k.km} · {desimal(r.liter, 2)} L</div>
        </section>
        <section style={s.kartu}>
          <div style={s.label}>{k.isiBensin}</div>
          <div style={{ ...s.angka, color: '#4ADE80' }}>Rp {rupiah(r.rupiahBeli)}</div>
          <div style={s.sub}>{r.isiBulan.length} {k.kali} · ±{desimal(r.literBeli)} L</div>
        </section>
      </div>

      <section style={s.kartu}>
        <div style={s.label}>{k.grafik}</div>
        <div style={s.grafik}>
          {r.perMinggu.map((v, i) => (
            <div key={i} style={s.kolom}>
              <span style={s.nilaiBatang}>{v ? `${desimal(v / 1000)}rb` : '-'}</span>
              <i style={{ ...s.batang, height: v ? Math.max(4, (v / maks) * 80) : 3, background: !v ? '#2B4A63' : adaData && i === terboros ? '#5ED0FF' : '#3C6F95' }} />
              <span style={s.namaBatang}>{k.minggu}{i + 1}</span>
            </div>
          ))}
        </div>
        {r.porsiMisi !== null && (
          <div style={s.porsi}>
            <div style={s.porsiBar}><i style={{ ...s.porsiIsi, width: `${r.porsiMisi}%` }} /></div>
            <span style={s.porsiAngka}>{r.porsiMisi}%</span>
          </div>
        )}
        {r.porsiMisi !== null && <div style={s.sub}>{k.porsi} {k.porsiKet}</div>}
      </section>

      <section style={s.kartu}>
        <div style={s.label}>{k.catatan} · {k.bln[bulan]} {tahun}</div>
        {r.isiBulan.length === 0 ? (
          <div style={{ ...s.sub, padding: '8px 0', lineHeight: 1.5 }}>{k.kosongCatatan}</div>
        ) : (
          r.isiBulan.slice(0, 12).map((t) => {
            const d = new Date(t.waktu)
            return (
              <SwipeableItem key={t.waktu} onDelete={() => hapusIsiBensin(t)} onEdit={() => { setNominal(String(t.rupiah)); setItemEdit(t) }}>
                <div style={s.barisIsi}>
                  <span style={s.tgl}>{String(d.getDate()).padStart(2, '0')}/{String(d.getMonth() + 1).padStart(2, '0')}</span>
                  <span style={s.ket}>{t.penuh ? k.penuh : k.isi}</span>
                  <span style={s.liter}>±{desimal(t.liter)} L</span>
                  <span style={s.rp}>Rp {rupiah(t.rupiah)}</span>
                </div>
              </SwipeableItem>
            )
          })
        )}
      </section>

      {itemEdit && (
        <div style={s.overlay} onClick={() => setItemEdit(null)}>
          <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.judulPopup}>{k.ubahIsi}</div>
            <label style={s.labelPopup}>
              {k.nominal}
              <input
                autoFocus
                style={s.inputPopup}
                type="text"
                inputMode="numeric"
                value={nominal}
                onChange={(e) => setNominal(e.target.value.replace(/\D/g, '').slice(0, 7))}
                onKeyDown={(e) => { if (e.key === 'Enter') simpan() }}
              />
            </label>
            <div style={s.sub}>{k.ketUbah}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" style={s.btnBatal} onClick={() => setItemEdit(null)}>{k.batal}</button>
              <button type="button" style={s.btnSimpan} onClick={simpan}>{k.simpan}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 },
  sheet: { width: '100%', maxWidth: 360, background: 'linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))', border: '1px solid var(--blue-border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' },
  judulPopup: { fontFamily: 'var(--font-judul)', fontSize: 18, color: 'var(--text)', letterSpacing: '0.5px' },
  labelPopup: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#9FC3E8' },
  inputPopup: { background: 'rgba(255,255,255,0.06)', border: '1px solid var(--blue-border)', borderRadius: 0, padding: '10px 12px', color: 'var(--text)', fontSize: 16, fontFamily: 'var(--font-data)' },
  btnBatal: { flex: 1, padding: '12px 0', background: 'rgba(255,255,255,0.06)', color: 'var(--text)', fontSize: 14, border: '1px solid var(--blue-border)', borderRadius: 0 },
  btnSimpan: { flex: 1, padding: '12px 0', background: 'var(--nav-red)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 0 },
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  baris: { display: 'flex', gap: 10 },
  kartu: { flex: 1, minWidth: 0, background: 'var(--card-blue)', border: '1px solid var(--blue-border)', padding: '12px 14px', boxSizing: 'border-box' },
  label: { fontSize: 12, color: '#9FC3E8', marginBottom: 6 },
  angka: { fontFamily: 'var(--font-data)', fontSize: 18, fontWeight: 700, color: '#FFFFFF' },
  sub: { fontSize: 12, color: '#8FB4DC', marginTop: 4 },
  grafik: { display: 'flex', gap: 4, marginTop: 6 },
  kolom: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: 112 },
  nilaiBatang: { fontFamily: 'var(--font-data)', fontSize: 10, color: '#FFFFFF' },
  batang: { width: '60%', display: 'block' },
  namaBatang: { fontSize: 10, color: '#8FB4DC' },
  porsi: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
  porsiBar: { flex: 1, height: 8, background: '#1E3A52' },
  porsiIsi: { display: 'block', height: 8, background: '#5ED0FF' },
  porsiAngka: { fontFamily: 'var(--font-data)', fontSize: 15, fontWeight: 700, color: '#5ED0FF' },
  barisIsi: { display: 'flex', alignItems: 'center', gap: 10, padding: '19px 0', background: 'var(--card-blue)', borderBottom: '1px solid rgba(44, 106, 143, 0.5)' },
  tgl: { width: 40, fontSize: 12, color: '#9FC3E8', flexShrink: 0 },
  ket: { flex: 1, minWidth: 0, fontSize: 13, color: '#FFFFFF' },
  liter: { fontFamily: 'var(--font-data)', fontSize: 12, color: '#8FB4DC', whiteSpace: 'nowrap' },
  rp: { fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 700, color: '#4ADE80', whiteSpace: 'nowrap' },
}
