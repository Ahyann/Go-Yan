import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { ROLE_BY_UID } from '../lib/roles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const berhentiDengar = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })
    return berhentiDengar
  }, [])

  const role = user ? ROLE_BY_UID[user.uid] ?? null : null

  const value = {
    user,
    role,
    logout: () => signOut(auth),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}