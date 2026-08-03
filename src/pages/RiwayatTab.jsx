import { useState } from 'react'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import MonthPickerPopup from '../components/MonthPickerPopup.jsx'

const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function RiwayatTab({ riwayat }) {
  const [showBulan, setShowBulan] = useState(false)

  const sekarang = new Date()
  const [bulanAktif, setBulanAktif] = useState(sekarang.getMonth())
  const [tahunAktif, setTahunAktif] = useState(sekarang.getFullYear())

  const riwayatTerfilter = riwayat.filter((r) => {
    const [tahun, bulan] = r.tanggal.split('-').map(Number)
    return bulan - 1 === bulanAktif && tahun === tahunAktif
  })

  const belumBayar = riwayat.filter((r) => r.statusBayar === STATUS_BAYAR.BELUM)
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

      <section style={s.cardBiru}>
        <div style={s.tagihanLabel}>Belum ditransfer</div>
        <div style={s.angkaBelum}>{formatRupiah(totalBelumBayar)}</div>
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
                  <div style={s.itemJam}>{r.jam} · {r.tanggal.split('-')[2]}</div>
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
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 22,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.3,
    marginTop: 2,
    whiteSpace: 'nowrap',
  },
  bulanBtn: {
    fontSize: 13, fontWeight: 600, color: 'var(--text)',
    background: 'var(--card-blue)', border: '1px solid var(--blue-border)',
    borderRadius: 999, padding: '6px 12px',
  },
  cardBiru: {
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--blue-border)',
    borderRadius: 12,
    padding: 20,
  },
  tagihanLabel: { fontSize: 13, color: '#9FC3E8', marginBottom: 6 },
  angkaBelum: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 26,
    color: '#FF4C4C', textShadow: '0 0 6px rgba(255,76,76,0.6)',
  },
  tagihanSub: { fontSize: 12, color: '#8FB4DC', marginTop: 4 },
  sectionTitle: { fontSize: 14, color: 'var(--text-dim)', marginBottom: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  kosong: { fontSize: 13.5, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--card-blue)',
    border: '1px solid var(--blue-border)',
    borderRadius: 10,
    padding: '12px 14px',
    gap: 12,
  },
  itemJam: { fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--text)' },
  itemDesc: { fontSize: 11.5, color: '#8FB4DC', marginTop: 2 },
  itemKanan: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  itemTarif: { fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--text)' },
  badgeLunas: {
    fontFamily: 'var(--font-data)', fontSize: 11.5,
    color: 'var(--signal)', textShadow: '0 0 5px rgba(74,222,128,0.5)',
  },
  badgeBelum: {
    fontFamily: 'var(--font-data)', fontSize: 11.5,
    color: '#FF4C4C', textShadow: '0 0 6px rgba(255,76,76,0.6)',
  },
}