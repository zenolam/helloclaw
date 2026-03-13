import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDate, formatTimeValue, getCurrentLocale, translateForLocale } from '@/i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const locale = getCurrentLocale()

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()

  if (isToday) {
    return formatTimeValue(d, { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  if (isYesterday) return translateForLocale(locale, 'common.yesterday')
  return formatDate(d, { month: 'numeric', day: 'numeric' })
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
