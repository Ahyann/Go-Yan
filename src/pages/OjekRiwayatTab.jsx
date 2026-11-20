import { useRef, useState } from 'react'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import MonthPickerPopup from '../components/MonthPickerPopup.jsx'
import EditRiwayatPopup from '../components/EditRiwayatPopup.jsx'
import SwipeableItem from '../components/SwipeableItem.jsx'

export default function OjekRiwayatTab({ riwayat, onTandaiLunas, onHapusRiwayat, onEditRiwayat }) {
  const { t } = useLanguage()
  const { isDemo } = useAuth()
  const [showBulan, setShowBulan] = useState(false)
  const [itemEdit, setItemEdit] = useState(null)

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

  const sudahBayarBulanIni = riwayatBulanIni.filter((r) => r.statusBayar === STATUS_BAYAR.LUNAS)
  const totalSudahDiterimaBulanIni = sudahBayarBulanIni.reduce((jumlah, r) => jumlah + r.tarif, 0)

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
          <h1 style={s.title}>{isDemo ? t.riwayatTitleOjekDemo : t.riwayatTitleOjek}</h1>
        </div>
        <button style={s.bulanBtn} onClick={() => setShowBulan(true)}>
          {t.namaBulanPanjang[bulanAktif]} {tahunAktif} ▾
        </button>
      </div>

      {/* Dua kartu ringkasan bersiku piksel: kiri belum ditransfer (merah), kanan diterima (cyan) yang bisa digeser: total lalu bulan ini */}
      <div style={s.ringkasanRow}>
        <section style={s.kartuRingkas}>
          <div style={s.scrollPage}>
            <div style={s.tagihanLabel}>{t.belumDitransfer}</div>
            <div style={s.angkaBelum}>{formatRupiah(totalBelumBayar)}</div>
            <div style={s.tagihanSub}>{belumBayar.length} {t.satuanPerjalanan}</div>
          </div>
        </section>
        <DiterimaCarousel
          totalSemua={totalSudahDiterima}
          jumlahSemua={sudahBayar.length}
          totalBulanIni={totalSudahDiterimaBulanIni}
          jumlahBulanIni={sudahBayarBulanIni.length}
          labelBulan={t.namaBulanPendek[bulanAktif]}
          t={t}
        />
      </div>

      <div style={s.list}>
        {riwayatBulanIni.length === 0 ? (
          <div style={s.kosong}>{t.belumAdaRiwayatBulanIni}</div>
        ) : (
          riwayatBulanIni.map((r) => (
            <SwipeableItem key={r.id} onDelete={() => onHapusRiwayat(r.id)} onEdit={() => setItemEdit(r)}>
              {/* Tiket: blok tanggal di kiri (hijau saat lunas), garis putus-putus, jam dan info, lalu harga dan tombol bergaya konsol */}
              <div style={s.tiket}>
                <div style={{ ...s.blokTanggal, background: r.statusBayar === STATUS_BAYAR.BELUM ? '#0B4466' : '#0B4A33' }}>
                  <span style={s.tanggalAngka}>{Number(r.tanggal.split('-')[2])}</span>
                  <span style={s.tanggalBulan}>{t.namaBulanPendek[Number(r.tanggal.split('-')[1]) - 1]}</span>
                </div>
                <div style={s.tiketIsi}>
                  <div style={s.tiketBaris}>
                    <span style={s.itemJam}>{r.jam}</span>
                    <span style={s.itemTarif}>{formatRupiah(r.tarif).replace(/^Rp\s?/, '')}</span>
                  </div>
                  <div style={{ ...s.tiketBaris, marginTop: 8 }}>
                    <span style={s.itemDesc}>{r.aksi === 'jemput' ? t.jemput : t.antar} · {r.where}</span>
                    {r.statusBayar === STATUS_BAYAR.BELUM ? (
                      <button className="tekan" style={s.lunasBtn} onClick={() => onTandaiLunas(r.id)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                        {t.tandaiLunas}
                      </button>
                    ) : (
                      <span style={s.lunasBadge}>✓ {t.lunas}</span>
                    )}
                  </div>
                </div>
              </div>
            </SwipeableItem>
          ))
        )}
      </div>

      {isDemo && riwayatBulanIni.length > 0 && <div style={s.tipDemo}>{t.demoTipRiwayat}</div>}

      {showBulan && (
        <MonthPickerPopup
          bulan={bulanAktif}
          tahun={tahunAktif}
          onClose={() => setShowBulan(false)}
          onSelect={handlePilihBulan}
        />
      )}

      {itemEdit && (
        <EditRiwayatPopup
          item={itemEdit}
          onClose={() => setItemEdit(null)}
          onSimpan={async (data) => {
            await onEditRiwayat(itemEdit.id, data)
            setItemEdit(null)
          }}
        />
      )}
    </main>
  )
}

function DiterimaCarousel({ totalSemua, jumlahSemua, totalBulanIni, jumlahBulanIni, labelBulan, t }) {
  const scrollRef = useRef(null)
  const [halaman, setHalaman] = useState(0)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setHalaman(Math.round(el.scrollLeft / el.clientWidth))
  }

  const halamanList = [
    { label: t.sudahDiterima, angka: totalSemua, sub: `${jumlahSemua} ${t.satuanPerjalanan}` },
    { label: `${t.sudahDiterima} ${labelBulan}`, angka: totalBulanIni, sub: `${jumlahBulanIni} ${t.satuanPerjalanan}` },
  ]

  return (
    <div style={s.kartuRingkas}>
      <div ref={scrollRef} className="no-scrollbar" style={s.scrollInner} onScroll={handleScroll}>
        {halamanList.map((h) => (
          <div key={h.label} style={s.scrollPage}>
            <div style={s.tagihanLabel}>{h.label}</div>
            <div style={s.angkaSudah}>{formatRupiah(h.angka)}</div>
            <div style={s.tagihanSub}>{h.sub}</div>
          </div>
        ))}
      </div>
      <div style={s.dotsRow}>
        {halamanList.map((h, i) => <span key={h.label} style={halaman === i ? s.dotAktif : s.dot} />)}
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
    borderRadius: 0, padding: '6px 12px',
  },
  ringkasanRow: { display: 'flex', gap: 8 },
  kartuRingkas: { position: 'relative', flex: 1, minWidth: 0, background: 'var(--card-blue)', border: '1px solid var(--blue-border)', overflow: 'hidden' },
  tiket: { display: 'flex', alignItems: 'stretch', background: 'var(--card-blue)', border: '1px solid var(--blue-border)' },
  blokTanggal: { width: 48, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, borderRight: '1px dashed rgba(2,18,29,0.9)' },
  tanggalAngka: { fontSize: 18, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 },
  tanggalBulan: { fontSize: 11, fontWeight: 600, color: '#9FD6F0' },
  tiketIsi: { flex: 1, minWidth: 0, padding: '11px 11px 11px 12px' },
  tiketBaris: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardBiru: {
    flex: 1,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--blue-border)',
    borderRadius: 0,
    padding: 16,
  },
  tagihanLabel: { fontSize: 12.5, color: '#9FC3E8', marginBottom: 6 },
  cardBiruScroll: {
    flex: 1,
    background: `linear-gradient(160deg, var(--card-blue-grad-a), var(--card-blue-grad-b))`,
    border: '1px solid var(--blue-border)',
    borderRadius: 0,
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
  angkaBelum: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap',
    color: 'var(--web-red)', textShadow: '0 0 6px rgba(226,54,54,0.5)',
  },
  angkaSudah: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap',
    color: 'var(--glow-blue)', textShadow: '0 0 6px var(--glow-blue-mid)',
  },
  tagihanSub: { fontSize: 12, color: '#8FB4DC', marginTop: 4 },
  // Daftar dalam satu panel, tiap perjalanan dipisah garis tipis
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  tipDemo: { fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 4, lineHeight: 1.4 },
  kosong: { fontSize: 13.5, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' },
  item: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--card-blue)',
    borderBottom: '1px solid var(--blue-border)',
    padding: '12px 12px 12px 14px',
    gap: 12,
  },
  itemKiri: { flex: 1, minWidth: 0 },
  itemJam: { fontFamily: 'var(--font-data)', fontSize: 15, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 },
  itemDesc: { minWidth: 0, fontSize: 12, color: '#8FB4DC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemTarif: { flexShrink: 0, fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' },
  // Tombol modern: latar cyan tipis, tulisan cyan, ikon centang
  lunasBtn: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    padding: '0 10px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--glow-blue)',
    background: 'rgba(94, 208, 255, 0.14)',
    border: 'none',
    borderRadius: 0,
    whiteSpace: 'nowrap',
  },
  lunasBadge: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: 600,
    color: '#4ADE80',
    whiteSpace: 'nowrap',
  },
}