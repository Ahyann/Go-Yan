import { useState } from 'react'
import { dummyJadwal, dummyRiwayat } from '../lib/dummyData'
import { STATUS_BAYAR, STATUS_RIDE, AKSI, formatRupiah } from '../lib/constants'
import JadwalCard from '../components/JadwalCard.jsx'
import GoPopup from '../components/GoPopup.jsx'
import BottomNav from '../components/BottomNav.jsx'
import MonthPickerPopup from '../components/MonthPickerPopup.jsx'

const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function PenumpangView() {
  const [jadwal, setJadwal] = useState(dummyJadwal)
  const [showGo, setShowGo] = useState(false)
  const [showBulan, setShowBulan] = useState(false)

  const sekarang = new Date()
  const [bulanAktif, setBulanAktif] = useState(sekarang.getMonth())
  const [tahunAktif, setTahunAktif] = useState(sekarang.getFullYear())

  const jadwalTerfilter = jadwal.filter((j) => {
    const [tahun, bulan] = j.tanggal.split('-').map(Number)
    return bulan - 1 === bulanAktif && tahun === tahunAktif
  })

  const belumBayar = dummyRiwayat.filter((r) => r.statusBayar === STATUS_BAYAR.BELUM)
  const totalBelumBayar = belumBayar.reduce((jumlah, r) => jumlah + r.tarif, 0)

  function handleKirimGo({ aksi, where, waktu }) {
    const labelAksi = aksi === AKSI.JEMPUT ? 'Jemput' : 'Antar'
    const entriBaru = {
      id: `go-${Date.now()}`,
      tanggal: new Date().toISOString().slice(0, 10),
      jam: waktu,
      catatan: `${labelAksi} · ${where}`,
      status: STATUS_RIDE.DIJADWALKAN,
    }
    setJadwal((daftarLama) => [entriBaru, ...daftarLama])
    setShowGo(false)
  }

  function handlePilihBulan(bulan, tahun) {
    setBulanAktif(bulan)
    setTahunAktif(tahun)
    setShowBulan(false)
  }

  return (
    <>
      <main style={s.wrap}>
        <header style={s.header}>
          <div style={s.eyebrow}>PENUMPANG</div>
          <h1 style={s.title}>Halo, Fajri</h1>
        </header>

        <section style={s.tagihanCard}>
          <div style={s.tagihanLabel}>Belum ditransfer</div>
          <div style={s.tagihanAngka}>{formatRupiah(totalBelumBayar)}</div>
          <div style={s.tagihanSub}>{belumBayar.length} perjalanan</div>
        </section>

        <section>
          <div style={s.sectionHead}>
            <h2 style={s.sectionTitle}>Jadwal</h2>
            <button style={s.bulanBtn} onClick={() => setShowBulan(true)}>
              {NAMA_BULAN[bulanAktif]} {tahunAktif} ▾
            </button>
          </div>
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
      </main>

      <BottomNav onGoClick={() => setShowGo(true)} />

      {showGo && <GoPopup onClose={() => setShowGo(false)} onSubmit={handleKirimGo} />}
      {showBulan && (
        <MonthPickerPopup
          bulan={bulanAktif}
          tahun={tahunAktif}
          onClose={() => setShowBulan(false)}
          onSelect={handlePilihBulan}
        />
      )}
    </>
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
    gap: 28,
  },
  header: {},
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: { fontSize: 26, letterSpacing: '-0.01em' },
  tagihanCard: {
    background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: 20,
  },
  tagihanLabel: { fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 },
  tagihanAngka: { fontSize: 32, fontWeight: 700, color: 'var(--web-red)', letterSpacing: '-0.02em' },
  tagihanSub: { fontSize: 13, color: 'var(--text-dim)', marginTop: 4 },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 14, color: 'var(--text-dim)' },
  bulanBtn: {
    fontSize: 13, fontWeight: 600, color: 'var(--text)',
    background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: 999, padding: '6px 12px',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  kosong: { fontSize: 13.5, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' },
}