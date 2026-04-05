import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCountdown } from '../use-countdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns ok urgency with countdown string before deadline (>2h)', () => {
    // Shopee SPX deadline = 11h. Set time to 8:00 => 3h remaining => ok
    vi.setSystemTime(new Date(2026, 3, 5, 8, 0, 0))

    const { result } = renderHook(() => useCountdown('Shopee SPX', 0))

    expect(result.current.urgency).toBe('ok')
    expect(result.current.countdown).toBe('3h 0min')
  })

  it('returns warning urgency with countdown string within 2h of deadline', () => {
    // Shopee SPX deadline = 11h. Set time to 9:30 => 1.5h remaining => warning
    vi.setSystemTime(new Date(2026, 3, 5, 9, 30, 0))

    const { result } = renderHook(() => useCountdown('Shopee SPX', 0))

    expect(result.current.urgency).toBe('warning')
    expect(result.current.countdown).toBe('1h 30min')
  })

  it('returns overdue with null countdown after deadline', () => {
    // Shopee SPX deadline = 11h. Set time to 12:00 => overdue
    vi.setSystemTime(new Date(2026, 3, 5, 12, 0, 0))

    const { result } = renderHook(() => useCountdown('Shopee SPX', 0))

    expect(result.current.urgency).toBe('overdue')
    expect(result.current.countdown).toBeNull()
  })

  it('returns done with null countdown when progress is 100%', () => {
    vi.setSystemTime(new Date(2026, 3, 5, 8, 0, 0))

    const { result } = renderHook(() => useCountdown('Shopee SPX', 100))

    expect(result.current.urgency).toBe('done')
    expect(result.current.countdown).toBeNull()
  })

  it('updates countdown every 60 seconds', () => {
    // Start at 8:00, 3h remaining
    vi.setSystemTime(new Date(2026, 3, 5, 8, 0, 0))

    const { result } = renderHook(() => useCountdown('Shopee SPX', 0))

    expect(result.current.countdown).toBe('3h 0min')

    // Advance 60s => 8:01, 2h 59min
    act(() => {
      vi.setSystemTime(new Date(2026, 3, 5, 8, 1, 0))
      vi.advanceTimersByTime(60000)
    })

    expect(result.current.countdown).toBe('2h 59min')
  })

  it('returns ok with null countdown for unknown grupo_envio', () => {
    vi.setSystemTime(new Date(2026, 3, 5, 8, 0, 0))

    const { result } = renderHook(() => useCountdown('Unknown Group', 0))

    expect(result.current.urgency).toBe('ok')
    expect(result.current.countdown).toBeNull()
  })
})
