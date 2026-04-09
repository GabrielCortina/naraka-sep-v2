'use client'

import type { PeriodFilter } from '../types'

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'personalizado', label: 'Personalizado' },
]

interface DashboardHeaderProps {
  period: PeriodFilter
  onPeriodChange: (period: PeriodFilter) => void
  customStart: string
  customEnd: string
  onCustomStartChange: (v: string) => void
  onCustomEndChange: (v: string) => void
  lastUpdated: string | null
}

export function DashboardHeader({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  lastUpdated,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          NARAKA <span className="text-muted-foreground font-normal">|</span> Dashboard Operacional
        </h1>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">
            Atualizado as {lastUpdated}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPeriodChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground border hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {period === 'personalizado' && (
          <div className="flex items-center gap-1.5 ml-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => onCustomStartChange(e.target.value)}
              className="bg-card border text-foreground text-xs rounded px-2 py-1.5 focus:border-primary focus:outline-none"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => onCustomEndChange(e.target.value)}
              className="bg-card border text-foreground text-xs rounded px-2 py-1.5 focus:border-primary focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}
