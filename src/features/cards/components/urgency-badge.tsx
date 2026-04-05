'use client'

import { cn } from '@/lib/utils'
import type { UrgencyTier } from '../types'

interface UrgencyBadgeProps {
  urgency: UrgencyTier
  countdown: string | null
}

const urgencyTextMap: Record<UrgencyTier, string> = {
  overdue: 'text-urgency-overdue',
  warning: 'text-urgency-warning',
  ok: 'text-urgency-ok',
  done: '',
}

export function UrgencyBadge({ urgency, countdown }: UrgencyBadgeProps) {
  if (urgency === 'done') return null

  return (
    <span
      key={urgency}
      className={cn(
        'font-bold text-sm animate-[pulse_150ms_ease-in-out_1]',
        urgencyTextMap[urgency],
      )}
    >
      {urgency === 'overdue' ? 'ATRASADO' : countdown}
    </span>
  )
}
