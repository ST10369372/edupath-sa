import { createContext, useContext, useState, useEffect } from 'react'
import { LANGUAGES, useTranslation } from '../lib/translations'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('edupath_lang') || 'en' }
    catch { return 'en' }
  })

  useEffect(() => {
    try { localStorage.setItem('edupath_lang', lang) } catch {}
  }, [lang])

  const tr = useTranslation(lang)

  return (
    <I18nContext.Provider value={{ lang, setLang, tr, LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
