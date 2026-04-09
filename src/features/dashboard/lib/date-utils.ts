import type { PeriodFilter } from '../types'

/**
 * Calcula intervalo de datas para o filtro de periodo do dashboard.
 * Todas as datas em formato 'YYYY-MM-DD' no timezone America/Sao_Paulo.
 * Aceita `now` opcional para testabilidade (mesmo padrao de getUrgencyTier).
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

    case '15d':
      return { start: subtractDays(now ?? new Date(), 14), end: today }

    case '30d':
      return { start: subtractDays(now ?? new Date(), 29), end: today }

    case 'mes_atual': {
      const [year, month] = today.split('-')
      return { start: `${year}-${month}-01`, end: today }
    }

    case 'ultimo_mes': {
      const ref = now ?? new Date()
      const spDate = new Date(ref.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
      const year = spDate.getFullYear()
      const month = spDate.getMonth() // 0-indexed, so this is already previous month's next

      // First day of previous month
      const prevMonth = month === 0 ? 12 : month
      const prevYear = month === 0 ? year - 1 : year
      const startStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`

      // Last day of previous month = day 0 of current month
      const lastDay = new Date(year, month, 0).getDate()
      const endStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      return { start: startStr, end: endStr }
    }

    case '3m':
      return { start: subtractDays(now ?? new Date(), 89), end: today }

    case 'personalizado':
      return { start: customStart!, end: customEnd! }

    default:
      return { start: today, end: today }
  }
}

function getToday(now?: Date): string {
  const ref = now ?? new Date()
  return ref.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function subtractDays(from: Date, days: number): string {
  const spDate = new Date(from.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  spDate.setDate(spDate.getDate() - days)
  const y = spDate.getFullYear()
  const m = String(spDate.getMonth() + 1).padStart(2, '0')
  const d = String(spDate.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
