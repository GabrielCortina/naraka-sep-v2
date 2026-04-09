import { describe, it, expect } from 'vitest'
import { getDateRange } from '../date-utils'

describe('getDateRange', () => {
  // Fixed reference date: 2026-03-20 in Sao Paulo
  const now = new Date('2026-03-20T15:00:00-03:00')

  it('hoje: returns today start/end', () => {
    const result = getDateRange('hoje', undefined, undefined, now)
    expect(result).toEqual({ start: '2026-03-20', end: '2026-03-20' })
  })

  it('ontem: returns yesterday start/end', () => {
    const result = getDateRange('ontem', undefined, undefined, now)
    expect(result).toEqual({ start: '2026-03-19', end: '2026-03-19' })
  })

  it('7d: returns 7 days ago to today', () => {
    const result = getDateRange('7d', undefined, undefined, now)
    expect(result).toEqual({ start: '2026-03-14', end: '2026-03-20' })
  })

  it('30d: returns 30 days ago to today', () => {
    const result = getDateRange('30d', undefined, undefined, now)
    expect(result).toEqual({ start: '2026-02-19', end: '2026-03-20' })
  })

  it('personalizado: returns custom dates', () => {
    const result = getDateRange('personalizado', '2026-03-01', '2026-03-15', now)
    expect(result).toEqual({ start: '2026-03-01', end: '2026-03-15' })
  })
})
