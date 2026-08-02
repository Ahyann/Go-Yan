import { useState } from 'react'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import JadwalCard from '../components/JadwalCard.jsx'
import MonthPickerPopup from '../components/MonthPickerPopup.jsx'

const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function RiwayatTab({ jadwal, riwayat }) {
  const [showBulan, setShowBulan] = useState(false)

  const sekarang = new Date()
  const [bulanAktif, setBulanAktif] = useState(sekarang.getMonth())
  const [tahunAktif, setTahunAktif] = useState(sekarang.getFullYear())

  const cocokBulan = (tanggal) => {
    const [tahun, bulan] = tanggal.split('-').map(Number)
    return bulan - 1 === bulanAktif && tahun === tahunAktif
  }

  const jadwalTerfilter = jadwal.filter((j) => cocokBulan(j.tanggal))
  const riwayatTerfilter = riwayat.filter((r) => cocokBulan(r.tanggal))

  const belumBayar = riwayatTerfilter.filter((r) => r.statusBayar === STATUS_BAYAR.BELUM)
  const totalBelumBayar = belumBayar.reduce((jumlah, r) => jumlah + r.tarif, 0)

  function handlePilihBulan(bulan, tahun) {
    setBulanAktif(bulan)
    setTahunAktif(tahun)
    setShowBulan(false)
  }

  return (
    <main style={s.wrap}>
      <div style={s.sectionHead}>
        <div>
          <div style={s.eyebrow}>RIWAYAT</div>
          <h1 style={s.title}>Perjalanan & tagihan</h1>
        </div>
        <button style={s.bulanBtn} onClick={() => setShowBulan(true)}>
          {NAMA_BULAN[bulanAktif]} {tahunAktif} ▾
        </button>
      </div>

      <section style={s.tagihanCard}>
        <div style={s.tagihanLabel}>Belum ditransfer</div>
        <div style={s.tagihanAngka}>{formatRupiah(totalBelumBayar)}</div>
        <div style={s.tagihanSub}>{belumBayar.length} perjalanan</div>
      </section>

      <section>
        <h2 style={s.sectionTitle}>Riwayat perjalanan</h2>
        <div style={s.list}>
          {riwayatTerfilter.length === 0 ? (
            <div style={s.kosong}>Belum ada perjalanan bulan ini.</div>
          ) : (
            riwayatTerfilter.map((r) => (
              <div key={r.id} style={s.item}>
                <div>
                  <div style={s.itemJam}>{r.jam} · {r.tanggal}</div>
                  <div style={s.itemDesc}>
                    {r.aksi === 'jemput' ? 'Jemput' : 'Antar'} · {r.where}
                  </div>
                </div>
                <div style={s.itemKanan}>
                  <div style={s.itemTarif}>{formatRupiah(r.tarif)}</div>
                  <div style={r.statusBayar === STATUS_BAYAR.LUNAS ? s.badgeLunas : s.badgeBelum}>
                    {r.statusBayar === STATUS_BAYAR.LUNAS ? 'Lunas' : 'Belum'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 style={s.sectionTitle}>Jadwal</h2>
        <div style={s.list}>
          {jadwalTerfilter.length === 0 ? (
            <div style={s.kosong}>Belum ada jadwal bulan ini.</div>
          ) : (
            jadwalTerfilter.map((j) => (
              <JadwalCard key={j.id} tanggal={j.tanggal} jam={j.jam} catatan={j.catatan} />
            ))
          )}
        </div>
      </section>

      {showBulan && (
        <MonthPickerPopup
          bulan={bulanAktif}
          tahun={tahunAktif}
          onClose={() => setShowBulan(false)}
          onSelect={handlePilihBulan}
        />
      )}
    </main>
  )
}

const s = {
  wrap: {
    minHeight: '100%',
    padding: 'calc(var(--safe-top) + 24px) 20px 110px',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: { fontSize: 26, letterSpacing: '-0.01em' },
  bulanBtn: {
    fontSize: 13, fontWeight: 600, color: 'var(--text)',
    background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: 999, padding: '6px 12px',
  },
  tagihanCard: {
    background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: 20,
  },
  tagihanLabel: { fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 },
  tagihanAngka: { fontSize: 32, fontWeight: 700, color: 'var(--web-red)', letterSpacing: '-0.02em' },
  tagihanSub: { fontSize: 13, color: 'var(--text-dim)', marginTop: 4 },
  sectionTitle: { fontSize: 14, color: 'var(--text-dim)', marginBottom: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  kosong: { fontSize: 13.5, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px',
    gap: 12,
  },
  itemJam: { fontSize: 14.5, fontWeight: 600 },
  itemDesc: { fontSize: 13, color: 'var(--text-dim)', marginTop: 2 },
  itemKanan: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  itemTarif: { fontSize: 14.5, fontWeight: 700 },
  badgeLunas: { fontSize: 11.5, color: 'var(--signal)', fontWeight: 600 },
  badgeBelum: { fontSize: 11.5, color: 'var(--warn)', fontWeight: 600 },
}