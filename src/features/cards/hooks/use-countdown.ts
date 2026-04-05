'use client'

import { useState, useEffect } from 'react'
import { DEADLINES } from '../lib/deadline-config'
import { getUrgencyTier, formatCountdown } from '../lib/card-utils'
import type { UrgencyTier } from '../types'

export function useCountdown(
  grupoEnvio: string,
  progressPercent: number,
): { countdown: string | null; urgency: UrgencyTier } {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const urgency = getUrgencyTier(grupoEnvio, progressPercent, now)

  if (urgency === 'done' || urgency === 'overdue') {
    return { countdown: null, urgency }
  }

  const deadlineHour = DEADLINES[grupoEnvio]
  if (!deadlineHour) return { countdown: null, urgency: 'ok' }

  const deadline = new Date(now)
  deadline.setHours(deadlineHour, 0, 0, 0)
  const diffMs = deadline.getTime() - now.getTime()
  const countdown = formatCountdown(diffMs)

  return { countdown, urgency }
}
