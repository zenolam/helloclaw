import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { enUSMessages } from './messages/en-US'
import { zhCNMessages, type ZhCNMessageKey } from './messages/zh-CN'

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const
export type Locale = typeof SUPPORTED_LOCALES[number]
export type TranslationKey = ZhCNMessageKey
export type TranslationVariables = Record<string, string | number>
export type TranslateFn = (key: TranslationKey, variables?: TranslationVariables) => string

const DEFAULT_LOCALE: Locale = 'zh-CN'
const STORAGE_KEY = 'helloclaw:language'
const SETTINGS_KEY = 'language'

const messages: Record<Locale, Record<TranslationKey, string>> = {
  'zh-CN': zhCNMessages,
  'en-US': enUSMessages,
}

function isLocale(value: string | null | undefined): value is Locale {
  return value === 'zh-CN' || value === 'en-US'
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null

  if (isLocale(value)) {
    return value
  }

  const lowerValue = value.toLowerCase()
  if (lowerValue.startsWith('zh')) return 'zh-CN'
  if (lowerValue.startsWith('en')) return 'en-US'

  return null
}

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE
  }

  const candidates = [navigator.language, ...(navigator.languages || [])]
  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate)
    if (normalized) {
      return normalized
    }
  }

  return DEFAULT_LOCALE
}

function interpolate(template: string, variables?: TranslationVariables): string {
  if (!variables) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = variables[name]
    return value == null ? `{${name}}` : String(value)
  })
}

type LocaleListener = () => void

const listeners = new Set<LocaleListener>()
let currentLocale: Locale = detectLocale()

function notifyListeners() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: LocaleListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return currentLocale
}

export function getCurrentLocale(): Locale {
  return currentLocale
}

export function setCurrentLocale(locale: Locale) {
  if (locale === currentLocale) return
  currentLocale = locale
  notifyListeners()
}

function getMessages(locale: Locale) {
  return messages[locale] ?? messages[DEFAULT_LOCALE]
}

export function translateForLocale(locale: Locale, key: TranslationKey, variables?: TranslationVariables): string {
  const template = getMessages(locale)[key] ?? messages[DEFAULT_LOCALE][key] ?? key
  return interpolate(template, variables)
}

export function translate(key: TranslationKey, variables?: TranslationVariables): string {
  return translateForLocale(currentLocale, key, variables)
}

async function loadPersistedLocale(): Promise<Locale | null> {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI

  if (isElectron && window.electronAPI) {
    const stored = await window.electronAPI.settings.get(SETTINGS_KEY)
    return normalizeLocale(stored)
  }

  if (typeof window !== 'undefined') {
    return normalizeLocale(localStorage.getItem(STORAGE_KEY))
  }

  return null
}

async function persistLocale(locale: Locale) {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI

  if (isElectron && window.electronAPI) {
    await window.electronAPI.settings.set(SETTINGS_KEY, locale)
    return
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale)
  }
}

function createFormatter(locale: Locale) {
  return {
    formatDateTime: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    formatDate: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    formatTime: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, options).format(value),
  }
}

export function formatDateTime(value: number | string | Date, options?: Intl.DateTimeFormatOptions): string {
  return createFormatter(currentLocale).formatDateTime(value, options)
}

export function formatDate(value: number | string | Date, options?: Intl.DateTimeFormatOptions): string {
  return createFormatter(currentLocale).formatDate(value, options)
}

export function formatTimeValue(value: number | string | Date, options?: Intl.DateTimeFormatOptions): string {
  return createFormatter(currentLocale).formatTime(value, options)
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return createFormatter(currentLocale).formatNumber(value, options)
}

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
  t: TranslateFn
  formatDateTime: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => string
  formatDate: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => string
  formatTime: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    let mounted = true

    void loadPersistedLocale().then((storedLocale) => {
      if (mounted && storedLocale) {
        setCurrentLocale(storedLocale)
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  const setLocale = useCallback(async (localeToPersist: Locale) => {
    setCurrentLocale(localeToPersist)
    await persistLocale(localeToPersist)
  }, [])

  const formatter = useMemo(() => createFormatter(locale), [locale])
  const t = useCallback<TranslateFn>((key, variables) => translateForLocale(locale, key, variables), [locale])

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t,
    formatDateTime: formatter.formatDateTime,
    formatDate: formatter.formatDate,
    formatTime: formatter.formatTime,
    formatNumber: formatter.formatNumber,
  }), [formatter, locale, setLocale, t])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }

  return context
}
