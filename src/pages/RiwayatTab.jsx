import { useRef, useState } from 'react'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import MonthPickerPopup from '../components/MonthPickerPopup.jsx'

export default function RiwayatTab({ riwayat }) {
  const { t } = useLanguage()
  const [showBulan, setShowBulan] = useState(false)

  const sekarang = new Date()
  const [bulanAktif, setBulanAktif] = useState(sekarang.getMonth())
  const [tahunAktif, setTahunAktif] = useState(sekarang.getFullYear())

  const riwayatTerfilter = riwayat
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

  const riwayatLunasBulanIni = riwayatTerfilter.filter((r) => r.statusBayar === STATUS_BAYAR.LUNAS)
  const totalBulanIni = riwayatLunasBulanIni.reduce((jumlah, r) => jumlah + r.tarif, 0)

  const riwayatLunasSemua = riwayat.filter((r) => r.statusBayar === STATUS_BAYAR.LUNAS)
  const totalSemua = riwayatLunasSemua.reduce((jumlah, r) => jumlah + r.tarif, 0)

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
          <h1 style={s.title}>{t.riwayatTitlePenumpang}</h1>
        </div>
        <button style={s.bulanBtn} onClick={() => setShowBulan(true)}>
          {t.namaBulanPanjang[bulanAktif]} {tahunAktif} ▾
        </button>
      </div>

      <div style={s.ringkasanRow}>
        <section style={s.cardBiruScroll}>
          <div style={s.scrollPage}>
            <div style={s.tagihanLabel}>{t.belumDitransfer}</div>
            <div style={s.angkaBelum}>{formatRupiah(totalBelumBayar)}</div>
            <div style={s.tagihanSub}>{belumBayar.length} {t.satuanPerjalanan}</div>
          </div>
          <div style={{ ...s.dotsRow, visibility: 'hidden' }}>
            <span style={s.dot} />
            <span style={s.dot} />
          </div>
        </section>

        <TotalSpendCarousel
          totalSemua={totalSemua}
          jumlahSemua={riwayatLunasSemua.length}
          totalBulanIni={totalBulanIni}
          jumlahBulanIni={riwayatLunasBulanIni.length}
          labelBulan={t.namaBulanPendek[bulanAktif]}
          t={t}
        />
      </div>

      <section>
        <h2 style={s.sectionTitle}>{t.riwayatPerjalananTitle}</h2>
        <div style={s.list}>
          {riwayatTerfilter.length === 0 ? (
            <div style={s.kosong}>{t.belumAdaPerjalananBulanIni}</div>
          ) : (
            riwayatTerfilter.map((r) => (
              <div key={r.id} style={s.item}>
                <div>
                  <div style={s.itemJam}>{r.jam} · {r.tanggal.split('-')[2]}</div>
                  <div style={s.itemDesc}>
                    {r.aksi === 'jemput' ? t.jemput : t.antar} · {r.where}
                  </div>
                </div>
                <div style={s.itemKanan}>
                  <div style={s.itemTarif}>{formatRupiah(r.tarif)}</div>
                  <div style={r.statusBayar === STATUS_BAYAR.LUNAS ? s.badgeLunas : s.badgeBelum}>
                    {r.statusBayar === STATUS_BAYAR.LUNAS ? t.lunas : t.belum}
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

function TotalSpendCarousel({ totalSemua, jumlahSemua, totalBulanIni, jumlahBulanIni, labelBulan, t }) {
  const scrollRef = useRef(null)
  const [halaman, setHalaman] = useState(0)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const posisi = Math.round(el.scrollLeft / el.clientWidth)
    setHalaman(posisi)
  }

  return (
    <div style={s.cardBiruScroll}>
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={s.scrollInner}
        onScroll={handleScroll}
      >
        <div style={s.scrollPage}>
          <div style={s.tagihanLabel}>{t.totalSpend} {labelBulan}</div>
          <div style={s.angkaTotal}>{formatRupiah(totalBulanIni)}</div>
          <div style={s.tagihanSub}>{jumlahBulanIni} {t.satuanPerjalanan}</div>
        </div>
        <div style={s.scrollPage}>
          <div style={s.tagihanLabel}>{t.totalSpend}</div>
          <div style={s.angkaTotal}>{formatRupiah(totalSemua)}</div>
          <div style={s.tagihanSub}>{jumlahSemua} {t.satuanPerjalanan}</div>
        </div>
      </div>
      <div style={s.dotsRow}>
        <span style={halaman === 0 ? s.dotAktif : s.dot} />
        <span style={halaman === 1 ? s.dotAktif : s.dot} />
      </div>
    </div>
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
  ringkasanRow: { display: 'flex', gap: 10 },
  cardBiruScroll: {
    flex: 1,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--blue-border)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollInner: {
    display: 'flex',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
  },
  scrollPage: {
    minWidth: '100%',
    flexShrink: 0,
    scrollSnapAlign: 'start',
    padding: 16,
    boxSizing: 'border-box',
  },
  dotsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 5,
    paddingBottom: 10,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
  },
  dotAktif: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'var(--glow-blue)',
    boxShadow: '0 0 4px var(--glow-blue-mid)',
  },
  tagihanLabel: { fontSize: 12.5, color: '#9FC3E8', marginBottom: 6 },
  angkaBelum: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 19,
    color: '#FF4C4C', textShadow: '0 0 6px rgba(255,76,76,0.6)',
  },
  angkaTotal: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 19,
    color: 'var(--glow-blue)', textShadow: '0 0 6px var(--glow-blue-mid)',
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
    color: 'var(--glow-blue)', textShadow: '0 0 5px var(--glow-blue-mid)',
  },
  badgeBelum: {
    fontFamily: 'var(--font-data)', fontSize: 11.5,
    color: '#FF4C4C', textShadow: '0 0 6px rgba(255,76,76,0.6)',
  },
}