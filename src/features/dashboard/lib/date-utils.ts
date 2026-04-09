import type { PeriodFilter } from '../types'

/**
 * Calcula intervalo de datas para o filtro de periodo do dashboard.
 * Todas as datas em formato 'YYYY-MM-DD' no timezone America/Sao_Paulo.
 */
export function getDateRange(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string,
  now?: Date,
): { start: string; end: string } {
  const today = getToday(now)

  switch (period) {
    case 'hoje':
      return { start: today, end: today }

    case 'ontem': {
      const yesterday = subtractDays(now ?? new Date(), 1)
      return { start: yesterday, end: yesterday }
    }

    case '7d':
      return { start: subtractDays(now ?? new Date(), 6), end: today }

    case '30d':
      return { start: subtractDays(now ?? new Date(), 29), end: today }

    case 'personalizado':
      return { start: customStart!, end: customEnd! }

    default:
      return { start: today, end: today }
  }
}

export function getToday(now?: Date): string {
  const ref = now ?? new Date()
  return ref.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function subtractDays(from: Date, days: number): string {
  const spDate = new Date(from.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  spDate.setDate(spDate.getDate() - days)
  const y = spDate.getFullYear()
  const m = String(spDate.getMonth() + 1).padStart(2, '0')
  const d = String(spDate.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
