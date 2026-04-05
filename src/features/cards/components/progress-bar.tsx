'use client'

import { cn } from '@/lib/utils'
import type { UrgencyTier } from '../types'

interface ProgressBarProps {
  percent: number
  urgency: UrgencyTier
}

const urgencyColorMap: Record<UrgencyTier, string> = {
  overdue: 'bg-urgency-overdue',
  warning: 'bg-urgency-warning',
  ok: 'bg-urgency-ok',
  done: 'bg-urgency-ok/40',
}

export function ProgressBar({ percent, urgency }: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent))

  return (
    <div className="h-1 w-full rounded-full bg-muted">
      <div
        className={cn(
          'h-1 rounded-full transition-all duration-300',
          urgencyColorMap[urgency],
        )}
        style={{ width: `${clampedPercent}%` }}
      />
    </div>
  )
}
