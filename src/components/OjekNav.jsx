import { useLanguage } from '../context/LanguageContext.jsx'
import { DeretanTab, DOCK_GELAP } from './TabDock.jsx'

// Dock melayang bergaya HUD, sama dengan dock Penumpang tapi tanpa tombol GO.
export default function OjekNav({ tabAktif, onTabChange, adaChatBaru = false, adaRiwayatBaru = false, adaPermintaanBaru = false }) {
  const { t } = useLanguage()
  return (
    <div style={s.luar}>
      <nav style={s.nav}>
        <DeretanTab
          aktif={tabAktif}
          onPilih={onTabChange}
          tab={[
            { id: 'home', label: t.navHome, teks: t.navHome, badge: adaChatBaru || adaPermintaanBaru, ikon: (
              <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
            ) },
            { id: 'jadwal', label: t.navJadwal, teks: t.navJadwal, badge: false, ikon: (
              <><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /></>
            ) },
            { id: 'riwayat', label: t.navRiwayat, teks: t.navRiwayat, badge: adaRiwayatBaru, ikon: (
              <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>
            ) },
            { id: 'akun', label: t.navAkun, teks: t.navAkun, badge: false, ikon: (
              <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.5-4 5-5.5 7-5.5s5.5 1.5 7 5.5" /></>
            ) },
          ]}
        />
      </nav>
    </div>
  )
}

const s = {
  // Pembungkus memberi jarak dari tepi layar; dock-nya sendiri tetap bagian dari layout.
  luar: {
    flexShrink: 0,
    padding: '8px 0 calc(var(--safe-bottom) + 8px)',
  },
  nav: {
    position: 'relative',
    height: 64,
    boxSizing: 'border-box',
    background: DOCK_GELAP,
    // Menjorok ke dalam bingkai seperti peta: tepi gelap di atas/kiri, terang di bawah/kanan, garis gelap di dalam
    borderStyle: 'solid',
    borderWidth: 4,
    borderColor: '#1A5E8A #8FD8FF #8FD8FF #1A5E8A',
    boxShadow: 'inset 0 0 0 2px #04192A, inset 3px 3px 0 rgba(0, 0, 0, 0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '0 4px',
  },
}
