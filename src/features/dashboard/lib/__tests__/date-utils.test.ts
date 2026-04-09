import { describe, it, expect } from 'vitest'
import { getDateRange } from '../date-utils'

describe('getDateRange', () => {
  // Fixed reference date: 2026-03-20 in Sao Paulo
  const now = new Date('2026-03-20T15:00:00-03:00')

  it('hoje: returns today start/end', () => {
    const result = getDateRange('hoje', undefined, undefined, now)
    expect(result).toEqual({ start: '2026-03-20', end: '2026-03-20' })
  })

  it('15d: returns 15 days ago to today', () => {
    const result = getDateRange('15d', undefined, undefined, now)
    expect(result).toEqual({ start: '2026-03-06', end: '2026-03-20' })
  })

  it('30d: returns 30 days ago to today', () => {
    const result = getDateRange('30d', undefined, undefined, now)
    expect(result).toEqual({ start: '2026-02-19', end: '2026-03-20' })
  })

  it('mes_atual: returns 1st of current month to today', () => {
    const result = getDateRange('mes_atual', undefined, undefined, now)
    expect(result).toEqual({ start: '2026-03-01', end: '2026-03-20' })
  })

  it('ultimo_mes: returns 1st to last day of previous month', () => {
    const result = getDateRange('ultimo_mes', undefined, undefined, now)
    expect(result).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  })

  it('3m: returns 3 months (90 days) ago to today', () => {
    const result = getDateRange('3m', undefined, undefined, now)
    expect(result).toEqual({ start: '2025-12-21', end: '2026-03-20' })
  })

  it('personalizado: returns custom dates', () => {
    const result = getDateRange('personalizado', '2026-03-01', '2026-03-15', now)
    expect(result).toEqual({ start: '2026-03-01', end: '2026-03-15' })
  })
})
