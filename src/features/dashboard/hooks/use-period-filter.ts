'use client'

import { useState, useMemo } from 'react'
import { getDateRange } from '../lib/date-utils'
import type { PeriodFilter } from '../types'

/**
 * Manages period filter state for the dashboard.
 * Computes date ranges for historical queries and exposes isHistorical flag
 * to determine whether rankings come from live tables or historico_diario.
 */
export function usePeriodFilter() {
  const [period, setPeriod] = useState<PeriodFilter>('hoje')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')

  const dateRange = useMemo(() => {
    if (period === 'personalizado' && customStart && customEnd) {
      return getDateRange(period, customStart, customEnd)
    }
    if (period === 'personalizado') return null
    return getDateRange(period)
  }, [period, customStart, customEnd])

  const isHistorical = period !== 'hoje'

  return {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    dateRange,
    isHistorical,
  }
}
