import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { ROLE_BY_UID } from '../lib/roles'
import { ROLE } from '../lib/constants'
import { resetDataDemo, seedDataDemo } from '../lib/demo'
import { bersihkanSesi } from '../lib/bersihkanSesi'

const AuthContext = createContext(null)
const KEY_DEMO_ROLE = 'go-yan-demo-role'

function ambilDemoRoleTersimpan() {
  try {
    return localStorage.getItem(KEY_DEMO_ROLE)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  const [demoRole, setDemoRole] = useState(ambilDemoRoleTersimpan)

  useEffect(() => {
    const berhentiDengar = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })
    return berhentiDengar
  }, [])

  const isDemo = Boolean(user?.isAnonymous)
  const role = isDemo ? demoRole : user ? ROLE_BY_UID[user.uid] ?? null : null

  async function masukDemo(roleDipilih) {
    bersihkanSesi() // sisa percobaan sebelumnya di perangkat ini tidak ikut terbawa
    try {
      localStorage.setItem(KEY_DEMO_ROLE, roleDipilih)
    } catch {}
    setDemoRole(roleDipilih)
    await signInAnonymously(auth)
    seedDataDemo()
  }

  // Pindah ke peran demo yang lain tanpa logout: sesi anonim dan data demo (yang dipakai bersama) tetap, hanya perannya
  // yang ditukar.
  function gantiPeranDemo() {
    if (!isDemo) return
    const baru = demoRole === ROLE.OJEK ? ROLE.PENUMPANG : ROLE.OJEK
    try {
      localStorage.setItem(KEY_DEMO_ROLE, baru)
    } catch {}
    setDemoRole(baru)
  }

  async function logout() {
    if (isDemo) {
      await resetDataDemo()
      try {
        localStorage.removeItem(KEY_DEMO_ROLE)
      } catch {}
      setDemoRole(null)
    }
    await signOut(auth)
    // sesudah keluar, supaya layar yang masih terbuka tidak sempat menyimpan ulang datanya
    bersihkanSesi()
  }

  const value = {
    user,
    role,
    isDemo,
    masukDemoOjek: () => masukDemo(ROLE.OJEK),
    masukDemoPenumpang: () => masukDemo(ROLE.PENUMPANG),
    gantiPeranDemo,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}