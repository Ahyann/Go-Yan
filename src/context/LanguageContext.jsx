import { createContext, useContext, useState } from 'react'
import { translations } from '../lib/translations'

const LanguageContext = createContext(null)

const KEY_LOCALSTORAGE = 'go-yan-bahasa'

export function LanguageProvider({ children }) {
  // Disimpen di localStorage (per-HP, bukan per-akun) — biar pilihan
  // bahasa gak reset tiap buka app, tapi juga gak perlu nyimpen ke
  // Firebase (ini preferensi tampilan doang, bukan data penting).
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(KEY_LOCALSTORAGE) || 'id'
    } catch {
      return 'id'
    }
  })

  function setLang(bahasaBaru) {
    setLangState(bahasaBaru)
    try {
      localStorage.setItem(KEY_LOCALSTORAGE, bahasaBaru)
    } catch {
      // gagal simpen (misal private browsing) — gapapa, tetep jalan
      // buat sesi ini doang.
    }
  }

  const t = translations[lang]

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
