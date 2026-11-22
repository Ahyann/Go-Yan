import { useLanguage } from '../context/LanguageContext.jsx'
import { useRiwayatBensin } from '../lib/bensin'

const TEKS = {
  id: {
    untukMisi: 'Bensin untuk misi', isiBensin: 'Isi bensin', trip: 'trip', km: 'km', kali: 'kali isi', grafik: 'Bensin untuk misi per minggu',
    catatan: 'Catatan isi bensin', kosongCatatan: 'Belum ada catatan isi bensin bulan ini. Ketuk CATAT ISI di halaman bensin setelah mengisi.',
    isi: 'Isi bensin', penuh: 'Isi penuh', porsi: 'Porsi bensin untuk misi', porsiKet: 'dari bensin yang kamu beli bulan ini', minggu: 'M',
    bln: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  },
  en: {
    untukMisi: 'Fuel for missions', isiBensin: 'Fuel bought', trip: 'trips', km: 'km', kali: 'fill-ups', grafik: 'Fuel for missions per week',
    catatan: 'Fill-up log', kosongCatatan: 'No fill-ups logged this month. Tap LOG FILL on the fuel page after refueling.',
    isi: 'Fill-up', penuh: 'Full tank', porsi: 'Share used for missions', porsiKet: 'of the fuel you bought this month', minggu: 'W',
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
              <div key={t.waktu} style={s.barisIsi}>
                <span style={s.tgl}>{String(d.getDate()).padStart(2, '0')}/{String(d.getMonth() + 1).padStart(2, '0')}</span>
                <span style={s.ket}>{t.penuh ? k.penuh : k.isi}</span>
                <span style={s.liter}>±{desimal(t.liter)} L</span>
                <span style={s.rp}>Rp {rupiah(t.rupiah)}</span>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}

const s = {
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
  barisIsi: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(44, 106, 143, 0.5)' },
  tgl: { width: 40, fontSize: 12, color: '#9FC3E8', flexShrink: 0 },
  ket: { flex: 1, minWidth: 0, fontSize: 13, color: '#FFFFFF' },
  liter: { fontFamily: 'var(--font-data)', fontSize: 12, color: '#8FB4DC', whiteSpace: 'nowrap' },
  rp: { fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 700, color: '#4ADE80', whiteSpace: 'nowrap' },
}
