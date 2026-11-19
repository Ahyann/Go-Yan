import { useState } from 'react'
import { STATUS_BAYAR, formatRupiah } from '../lib/constants'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useHitungNaik } from '../lib/useHitungNaik'
import MonthPickerPopup from '../components/MonthPickerPopup.jsx'

// Paling banyak segini kotak yang digambar di panel tagihan, sisanya ditulis "+N".
const MAKS_KOTAK = 20

export default function RiwayatTab({ riwayat }) {
  const { t } = useLanguage()
  const { isDemo } = useAuth()
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

  // Satu kotak per perjalanan di bulan yang dipilih: yang lunas dulu, baru yang belum.
  const jumlahLunas = riwayatLunasBulanIni.length
  const jumlahBelum = riwayatTerfilter.length - jumlahLunas
  const kotak = [
    ...Array(jumlahLunas).fill(true),
    ...Array(jumlahBelum).fill(false),
  ]
  const kotakTampil = kotak.slice(0, MAKS_KOTAK)
  const kotakSisa = kotak.length - kotakTampil.length

  const angkaBelum = useHitungNaik(totalBelumBayar)

  function handlePilihBulan(bulan, tahun) {
    setBulanAktif(bulan)
    setTahunAktif(tahun)
    setShowBulan(false)
  }

  return (
    <main style={s.wrap}>
      <div className="naik-masuk" style={{ ...s.sectionHead, '--i': 0 }}>
        <div>
          <div style={s.eyebrow}>{t.riwayatEyebrow}</div>
          <h1 style={s.title}>{t.riwayatTitlePenumpang}</h1>
        </div>
        <button className="tekan" style={s.bulanBtn} onClick={() => setShowBulan(true)}>
          <span style={s.bulanTeks}>
            {t.namaBulanPendek[bulanAktif]} {tahunAktif}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--glow-blue)" shapeRendering="crispEdges" aria-hidden="true">
              <path d="M2 4h8v2H8v2H7v2H5V8H4V6H2z" />
            </svg>
          </span>
          <span style={s.garisPutus} />
        </button>
      </div>

      <section className="naik-masuk" style={{ ...s.panel, '--i': 1 }}>

        <div>
          <div style={s.panelLabel}>{t.belumDitransfer}</div>
          <div style={s.angkaBelum}>{formatRupiah(angkaBelum)}</div>
          <div style={s.panelSub}>{belumBayar.length} {t.satuanPerjalanan}</div>
        </div>

        {kotak.length > 0 && (
          <div style={s.kotakBaris}>
            <div
              style={s.kotakRow}
              role="img"
              aria-label={`${jumlahLunas} ${t.lunas}, ${jumlahBelum} ${t.belum}`}
            >
              {kotakTampil.map((lunas, i) => (
                <span
                  key={i}
                  className="kotak-pop"
                  style={{ ...s.kotak, background: lunas ? 'var(--glow-blue)' : '#FF4C4C', '--i': i }}
                />
              ))}
              {kotakSisa > 0 && <span style={s.kotakSisa}>+{kotakSisa}</span>}
            </div>
            <div style={s.kotakKet}>
              {jumlahLunas} {t.lunas.toLowerCase()} · {jumlahBelum} {t.belum.toLowerCase()}
            </div>
          </div>
        )}

        <div style={s.garis} />

        <div style={s.totalBaris}>
          <div style={s.panelLabel}>{t.totalSpend} {t.namaBulanPendek[bulanAktif]}</div>
          <div style={s.angkaTotal}>{formatRupiah(totalBulanIni)}</div>
        </div>
        <div style={s.totalBaris}>
          <div style={s.panelLabel}>{t.totalSpend}</div>
          <div style={s.angkaTotalRedup}>{formatRupiah(totalSemua)}</div>
        </div>
      </section>

      <section>
        <h2 className="naik-masuk" style={{ ...s.sectionTitle, '--i': 2 }}>{t.riwayatPerjalananTitle}</h2>
        <div>
          {riwayatTerfilter.length === 0 ? (
            <div className="naik-masuk" style={{ ...s.kosong, '--i': 3 }}>{t.belumAdaPerjalananBulanIni}</div>
          ) : (
            riwayatTerfilter.map((r, i) => {
              const lunas = r.statusBayar === STATUS_BAYAR.LUNAS
              const terakhir = i === riwayatTerfilter.length - 1
              return (
                <div
                  key={r.id}
                  className="naik-masuk"
                  style={{ ...s.item, borderBottom: terakhir ? 'none' : '1px solid var(--garis)', '--i': Math.min(i, 8) + 3 }}
                >
                  <span style={{ ...s.itemKotak, background: lunas ? 'var(--glow-blue)' : '#FF4C4C' }} />
                  <div style={s.itemTengah}>
                    <div style={s.itemDesc}>
                      {r.aksi === 'jemput' ? t.jemput : t.antar} · {r.where}
                    </div>
                    <div style={s.itemJam}>
                      {r.tanggal.split('-')[2]} {t.namaBulanPendek[bulanAktif]} · {r.jam}
                    </div>
                  </div>
                  <div style={s.itemKanan}>
                    <div style={s.itemTarif}>{formatRupiah(r.tarif)}</div>
                    <div style={lunas ? s.statusLunas : s.statusBelum}>{lunas ? t.lunas : t.belum}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {isDemo && <div style={s.catatanDemo}>{t.demoCatatanRiwayatPenumpang}</div>}

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
    padding: 'calc(var(--safe-top) + 24px) 20px 120px',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  eyebrow: {
    fontFamily: 'var(--font-data)', fontSize: 11, letterSpacing: '0.12em',
    color: 'var(--text-dim)', marginBottom: 4,
  },
  title: {
    fontFamily: 'var(--font-judul)',
    fontWeight: 400,
    fontSize: 24,
    color: 'var(--text)',
    letterSpacing: '1px',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
  bulanBtn: {
    minHeight: 44,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 5,
    color: 'var(--text)',
    flexShrink: 0,
  },
  bulanTeks: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' },
  garisPutus: {
    height: 2,
    background: 'var(--glow-blue)',
    borderRadius: 0,
  },

  panel: {
    position: 'relative',
    background: 'var(--panel)',
    border: '1px solid var(--garis)',
    borderRadius: 0,
    padding: '16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  panelLabel: { fontSize: 13, color: 'var(--text-dim)' },
  panelSub: { fontSize: 12, color: 'var(--text-dim)', marginTop: 2 },
  angkaBelum: {
    fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 28, lineHeight: 1.2,
    color: 'var(--merah-teks)', marginTop: 4,
  },
  kotakBaris: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  kotakRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, minWidth: 0 },
  kotak: { width: 12, height: 12, borderRadius: 0 },
  kotakSisa: { fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-dim)', marginLeft: 2 },
  kotakKet: { fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' },
  garis: { height: 1, background: 'var(--garis)' },
  totalBaris: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  angkaTotal: { fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 15, color: 'var(--glow-blue)' },
  angkaTotalRedup: { fontFamily: 'var(--font-data)', fontSize: 14, color: 'var(--text)' },

  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 },
  catatanDemo: { fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.4 },
  kosong: { fontSize: 13.5, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' },
  item: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' },
  itemKotak: { width: 8, height: 8, borderRadius: 0, flexShrink: 0 },
  itemTengah: { flex: 1, minWidth: 0 },
  itemDesc: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  itemJam: { fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-dim)', marginTop: 3 },
  itemKanan: { textAlign: 'right' },
  itemTarif: { fontFamily: 'var(--font-data)', fontSize: 14, color: 'var(--text)' },
  statusLunas: { fontSize: 12, fontWeight: 600, color: 'var(--glow-blue)', marginTop: 3 },
  statusBelum: { fontSize: 12, fontWeight: 600, color: 'var(--merah-teks)', marginTop: 3 },
}
