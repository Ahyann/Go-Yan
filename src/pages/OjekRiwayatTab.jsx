import { useState } from 'react'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import MonthPickerPopup from '../components/MonthPickerPopup.jsx'

const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default function OjekRiwayatTab({ riwayat, onTandaiLunas }) {
  const [showBulan, setShowBulan] = useState(false)

  const sekarang = new Date()
  const [bulanAktif, setBulanAktif] = useState(sekarang.getMonth())
  const [tahunAktif, setTahunAktif] = useState(sekarang.getFullYear())

  const riwayatBulanIni = riwayat.filter((r) => {
    const [tahun, bulan] = r.tanggal.split('-').map(Number)
    return bulan - 1 === bulanAktif && tahun === tahunAktif
  })

  const belumBayar = riwayatBulanIni.filter((r) => r.statusBayar === STATUS_BAYAR.BELUM)
  const totalBelumBayar = belumBayar.reduce((jumlah, r) => jumlah + r.tarif, 0)

  const sudahBayar = riwayatBulanIni.filter((r) => r.statusBayar === STATUS_BAYAR.LUNAS)
  const totalSudahDiterima = sudahBayar.reduce((jumlah, r) => jumlah + r.tarif, 0)

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
          <h1 style={s.title}>Tagihan sepupu</h1>
        </div>
        <button style={s.bulanBtn} onClick={() => setShowBulan(true)}>
          {NAMA_BULAN[bulanAktif]} {tahunAktif} ▾
        </button>
      </div>

      <div style={s.ringkasanRow}>
        <section style={s.tagihanCard}>
          <div style={s.tagihanLabel}>Belum ditransfer</div>
          <div style={s.tagihanAngka}>{formatRupiah(totalBelumBayar)}</div>
          <div style={s.tagihanSub}>{belumBayar.length} perjalanan</div>
        </section>

        <section style={s.pendapatanCard}>
          <div style={s.tagihanLabel}>Sudah diterima</div>
          <div style={s.pendapatanAngka}>{formatRupiah(totalSudahDiterima)}</div>
          <div style={s.tagihanSub}>{sudahBayar.length} perjalanan</div>
        </section>
      </div>

      <div style={s.list}>
        {riwayatBulanIni.length === 0 ? (
          <div style={s.kosong}>Belum ada riwayat bulan ini.</div>
        ) : (
          riwayatBulanIni.map((r) => (
            <div key={r.id} style={s.item}>
              <div>
                <div style={s.itemJam}>{r.jam} · {r.tanggal}</div>
                <div style={s.itemDesc}>
                  {r.aksi === 'jemput' ? 'Jemput' : 'Antar'} · {r.where}
                </div>
              </div>
              <div style={s.itemKanan}>
                <div style={s.itemTarif}>{formatRupiah(r.tarif)}</div>
                {r.statusBayar === STATUS_BAYAR.BELUM ? (
                  <button style={s.lunasBtn} onClick={() => onTandaiLunas(r.id)}>
                    Tandai Lunas
                  </button>
                ) : (
                  <div style={s.lunasBadge}>Lunas</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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
    gap: 20,
  },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 4 },
  title: { fontSize: 26, letterSpacing: '-0.01em' },
  bulanBtn: {
    fontSize: 13, fontWeight: 600, color: 'var(--text)',
    background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: 999, padding: '6px 12px',
  },
  ringkasanRow: { display: 'flex', gap: 10 },
  tagihanCard: {
    flex: 1,
    background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
    border: '1px solid var(--web-red)',
    borderRadius: 'var(--radius)',
    padding: 16,
  },
  pendapatanCard: {
    flex: 1,
    background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
    border: '1px solid var(--signal)',
    borderRadius: 'var(--radius)',
    padding: 16,
  },
  tagihanLabel: { fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 6 },
  tagihanAngka: { fontSize: 22, fontWeight: 700, color: 'var(--web-red)', letterSpacing: '-0.02em' },
  pendapatanAngka: { fontSize: 22, fontWeight: 700, color: 'var(--signal)', letterSpacing: '-0.02em' },
  tagihanSub: { fontSize: 12, color: 'var(--text-dim)', marginTop: 4 },
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
  itemKanan: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  itemTarif: { fontSize: 14.5, fontWeight: 700 },
  lunasBtn: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--web-red)',
    background: 'transparent',
    border: '1px solid var(--web-red)',
    borderRadius: 999,
    padding: '5px 10px',
  },
  lunasBadge: {
    fontSize: 11.5,
    color: 'var(--signal)',
    fontWeight: 600,
  },
}