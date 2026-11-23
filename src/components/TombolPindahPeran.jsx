import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { ROLE } from '../lib/constants'
import { getar } from '../lib/getar'
import { mulaiTransisiDemo } from '../lib/transisiDemo'

// Hanya di akun demo: pindah langsung antara Ojek dan Penumpang tanpa logout (data demo tidak direset). Layar kaca
// "DEMO AS ..." menutupi pergantian, lalu fokus ke app dengan peran yang baru.
export default function TombolPindahPeran() {
  const { isDemo, role, gantiPeranDemo } = useAuth()
  const { t } = useLanguage()
  if (!isDemo) return null

  const tujuan = role === ROLE.OJEK ? ROLE.PENUMPANG : ROLE.OJEK

  function pindah() {
    getar(10)
    mulaiTransisiDemo(tujuan, 900)
    setTimeout(gantiPeranDemo, 500) // pergantian terjadi saat kaca sudah menutupi layar
  }

  return (
    <button type="button" className="tekan" style={s.tombol} onClick={pindah}>
      {tujuan === ROLE.OJEK ? t.demoPindahOjek : t.demoPindahPenumpang}
    </button>
  )
}

const s = {
  tombol: {
    background: 'transparent',
    color: 'var(--glow-blue)',
    border: '2px solid var(--glow-blue)',
    fontFamily: 'var(--font-data)',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '13px',
    borderRadius: 0,
  },
}
