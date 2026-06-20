import { createContext, useContext, useState } from 'react'
import { translations } from './translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('appLang') || 'en')

  const changeLang = (code) => {
    setLang(code)
    localStorage.setItem('appLang', code)
  }

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    console.error('useLanguage called outside LanguageProvider!')
    return { lang: 'en', changeLang: () => {}, t: (k) => k }
  }
  return ctx
}