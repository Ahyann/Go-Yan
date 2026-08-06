import { useState } from 'react'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import MonthPickerPopup from '../components/MonthPickerPopup.jsx'
import SwipeableItem from '../components/SwipeableItem.jsx'

export default function OjekRiwayatTab({ riwayat, onTandaiLunas, onHapusRiwayat }) {
  const { t } = useLanguage()
  const [showBulan, setShowBulan] = useState(false)

  const sekarang = new Date()
  const [bulanAktif, setBulanAktif] = useState(sekarang.getMonth())
  const [tahunAktif, setTahunAktif] = useState(sekarang.getFullYear())

  const riwayatBulanIni = riwayat
    .filter((r) => {
      const [tahun, bulan] = r.tanggal.split('-').map(Number)
      return bulan - 1 === bulanAktif && tahun === tahunAktif
    })
    .sort((a, b) => {
      if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal)
      if (a.aksi !== b.aksi) return a.aksi === 'antar' ? -1 : 1
      return 0
    })

  const belumBayar = riwayat.filter((r) => r.statusBayar === STATUS_BAYAR.BELUM)
  const totalBelumBayar = belumBayar.reduce((jumlah, r) => jumlah + r.tarif, 0)

  const sudahBayar = riwayat.filter((r) => r.statusBayar === STATUS_BAYAR.LUNAS)
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
          <div style={s.eyebrow}>{t.riwayatEyebrow}</div>
          <h1 style={s.title}>{t.riwayatTitleOjek}</h1>
        </div>
        <button style={s.bulanBtn} onClick={() => setShowBulan(true)}>
          {t.namaBulanPanjang[bulanAktif]} {tahunAktif} ▾
        </button>
      </div>

      <div style={s.ringkasanRow}>
        <section style={s.cardBiru}>
          <div style={s.tagihanLabel}>{t.belumDitransfer}</div>
          <div style={s.angkaBelum}>{formatRupiah(totalBelumBayar)}</div>
          <div style={s.tagihanSub}>{belumBayar.length} {t.satuanPerjalanan}</div>
        </section>

        <section style={s.cardBiru}>
          <div style={s.tagihanLabel}>{t.sudahDiterima}</div>
          <div style={s.angkaSudah}>{formatRupiah(totalSudahDiterima)}</div>
          <div style={s.tagihanSub}>{sudahBayar.length} {t.satuanPerjalanan}</div>
        </section>
      </div>

      <div style={s.list}>
        {riwayatBulanIni.length === 0 ? (
          <div style={s.kosong}>{t.belumAdaRiwayatBulanIni}</div>
        ) : (
          riwayatBulanIni.map((r) => (
            <SwipeableItem key={r.id} onDelete={() => onHapusRiwayat(r.id)}>
              <div style={s.item}>
                <div>
                  <div style={s.itemJam}>{r.jam} · {r.tanggal.split('-')[2]}</div>
                  <div style={s.itemDesc}>
                    {r.aksi === 'jemput' ? t.jemput : t.antar} · {r.where}
                  </div>
                </div>
                <div style={s.itemKanan}>
                  <div style={s.itemTarif}>{formatRupiah(r.tarif)}</div>
                  {r.statusBayar === STATUS_BAYAR.BELUM ? (
                    <button style={s.lunasBtn} onClick={() => onTandaiLunas(r.id)}>
                      {t.tandaiLunas}
                    </button>
                  ) : (
                    <div style={s.lunasBadge}>{t.lunas}</div>
                  )}
                </div>
              </div>
            </SwipeableItem>
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
  title: {
    fontFamily: 'var(--font-judul)',
    fontSize: 24,
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
  ringkasanRow: { display: 'flex', gap: 10 },
  cardBiru: {
    flex: 1,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--blue-border)',
    borderRadius: 12,
    padding: 16,
  },
  tagihanLabel: { fontSize: 12.5, color: '#9FC3E8', marginBottom: 6 },
  angkaBelum: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 19,
    color: 'var(--web-red)', textShadow: '0 0 6px rgba(226,54,54,0.5)',
  },
  angkaSudah: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 19,
    color: 'var(--glow-blue)', textShadow: '0 0 6px var(--glow-blue-mid)',
  },
  tagihanSub: { fontSize: 12, color: '#8FB4DC', marginTop: 4 },
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
  itemKanan: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  itemTarif: { fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--text)' },
  lunasBtn: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--warn)',
    background: 'transparent',
    border: '1px solid var(--warn)',
    borderRadius: 999,
    padding: '4px 10px',
    lineHeight: 1.3,
  },
  lunasBadge: {
    fontFamily: 'var(--font-data)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--glow-blue)',
    textShadow: '0 0 5px var(--glow-blue-mid)',
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid transparent',
    lineHeight: 1.3,
  },
}