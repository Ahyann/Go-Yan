import { useLanguage } from '../context/LanguageContext.jsx'
import { TARIF_PER_RIDE } from '../lib/constants'
import TampilanLevel from './TampilanLevel.jsx'

const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID')

// Halaman level di konsol ojek, dibuka dengan memencet LV di baris status (seperti halaman cuaca dan bensin).
// Satu layar tanpa kepala: tombol kembali di baris LV, total uang dibanding target, garis, lalu tiga angka ringkas
// berwarna (total trip cyan, per trip hijau, sisa trip ke level berikutnya kuning).
export default function KonsolLevel({ total, totalTrip = null, onKembali }) {
  const { lang } = useLanguage()
  return (
    <div className="tv-nyala">
      <TampilanLevel
        total={total ?? 0}
        rapat
        onKembali={onKembali}
        statistik={[
          [`${totalTrip ?? '--'} TRIPS`, 'TOTAL', '#5ED0FF'],
          ['+' + rp(TARIF_PER_RIDE), lang === 'en' ? 'PER TRIP' : 'PER TRIP', '#6CF29A'],
        ]}
      />
    </div>
  )
}
