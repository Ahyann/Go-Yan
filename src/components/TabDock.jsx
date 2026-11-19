import { useLayoutEffect, useRef, useState } from 'react'
import { playTabPindah, playTabSorot } from '../lib/sound'

// Deretan tab dock bawah yang dipakai Penumpang dan Ojek. Satu penanda (siku cyan di
// empat pojok plus latar cyan tipis) meluncur ke tab yang disorot kursor, lalu kembali
// ke tab aktif saat kursor keluar, jadi tidak pernah ada dua penanda sekaligus.

const CYAN = 'var(--glow-blue)'
const SIKU = `2px solid ${CYAN}`

export const DOCK_GELAP = '#011A29'

// Penanda bergerak seperti benda berbobot: tepi depan melesat lebih dulu, tepi belakang menyusul agak
// lambat tanpa membal, jadi penanda meregang saat meluncur lalu mengerem halus di tab tujuan.
const LEAD = '0.18s cubic-bezier(0.2, 0.8, 0.3, 1)'
const LAG = '0.3s cubic-bezier(0.25, 0.9, 0.35, 1)'
const GERAK_KANAN = `right ${LEAD}, left ${LAG}`
const GERAK_KIRI = `left ${LEAD}, right ${LAG}`

// tab: [{ id, label, teks, ikon (isi svg), badge }]
export function DeretanTab({ tab, aktif, onPilih }) {
  const [sorot, setSorot] = useState(null)
  const [kotak, setKotak] = useState(null)
  const [siap, setSiap] = useState(false)
  const refWadah = useRef(null)
  const refTombol = useRef({})

  const target = sorot ?? aktif

  // Ukur posisi tab target relatif ke wadah. Diulang saat lebar wadah berubah.
  useLayoutEffect(() => {
    const wadah = refWadah.current
    if (!wadah) return undefined
    const ukur = () => {
      const el = refTombol.current[target]
      if (!el) return
      const left = el.offsetLeft
      const right = Math.max(0, wadah.clientWidth - (left + el.offsetWidth))
      setKotak((k) => {
        if (k && k.left === left && k.right === right) return k
        // Arah gerak menentukan tepi mana yang memimpin (lihat gayaPenanda).
        return { left, right, kanan: k ? left >= k.left : true }
      })
    }
    ukur()
    const pengamat = new ResizeObserver(ukur)
    pengamat.observe(wadah)
    return () => pengamat.disconnect()
  }, [target])

  // Transisi baru dinyalakan setelah penanda punya posisi awal, supaya tidak meluncur dari kiri saat dibuka.
  useLayoutEffect(() => {
    if (kotak && !siap) {
      const id = requestAnimationFrame(() => setSiap(true))
      return () => cancelAnimationFrame(id)
    }
    return undefined
  }, [kotak, siap])

  return (
    <div ref={refWadah} style={s.wadah} onPointerLeave={() => setSorot(null)}>
      {kotak && (
        <span
          aria-hidden="true"
          style={{ ...s.penanda, left: kotak.left, right: kotak.right, transition: siap ? (kotak.kanan ? GERAK_KANAN : GERAK_KIRI) : 'none' }}
        >
          <span style={{ ...s.siku, top: 0, left: 0, borderTop: SIKU, borderLeft: SIKU }} />
          <span style={{ ...s.siku, top: 0, right: 0, borderTop: SIKU, borderRight: SIKU }} />
          <span style={{ ...s.siku, bottom: 0, left: 0, borderBottom: SIKU, borderLeft: SIKU }} />
          <span style={{ ...s.siku, bottom: 0, right: 0, borderBottom: SIKU, borderRight: SIKU }} />
        </span>
      )}
      {tab.map((t) => {
        const dipilih = t.id === aktif
        return (
          <button
            key={t.id}
            ref={(el) => { refTombol.current[t.id] = el }}
            className="tekan tab-dock"
            style={s.tab}
            onClick={() => {
              if (!dipilih) playTabPindah()
              onPilih(t.id)
            }}
            onPointerEnter={(e) => {
              if (e.pointerType !== 'mouse') return
              if (target !== t.id) playTabSorot()
              setSorot(t.id)
            }}
            aria-label={t.label}
            aria-current={dipilih ? 'page' : undefined}
          >
            <span className={dipilih ? 'ikon-lompat' : undefined} style={s.iconWrap}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden="true">
                {t.ikon}
              </svg>
              {t.badge && <span style={s.badgeDot} />}
            </span>
            <span style={s.teks}>{t.teks}</span>
          </button>
        )
      })}
    </div>
  )
}

const s = {
  wadah: { position: 'relative', flex: 1, minWidth: 0, height: 48, display: 'flex', alignItems: 'stretch', gap: 2 },
  tab: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    minWidth: 0,
    height: 48,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    color: CYAN,
  },
  penanda: {
    position: 'absolute',
    top: 0,
    height: 48,
    boxSizing: 'border-box',
    background: 'rgba(94, 208, 255, 0.14)',
    pointerEvents: 'none',
  },
  siku: { position: 'absolute', width: 9, height: 9 },
  iconWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  teks: {
    fontFamily: 'var(--font-data)',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    lineHeight: 1,
  },
  // Kotak kuning kecil di pojok kanan atas ikon: ada hal baru yang belum dibuka.
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -6,
    width: 10,
    height: 10,
    background: '#FFD23F',
    border: '2px solid #000',
  },
}
