'use client'

import type { SeparadorProgress } from '../types'
import type { UrgencyTier } from '@/features/cards/types'
import { DashboardBlock } from './dashboard-block'
import { ProgressBar } from '@/features/cards/components/progress-bar'

interface PorSeparadorProps {
  entries: SeparadorProgress[]
}

function getUrgencyFromPercent(percent: number): UrgencyTier {
  if (percent < 20) return 'overdue'
  if (percent <= 50) return 'warning'
  return 'ok'
}

export function PorSeparador({ entries }: PorSeparadorProps) {
  return (
    <DashboardBlock title="POR SEPARADOR">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum dado disponivel</p>
      ) : (
        <div>
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className="flex items-center gap-2 py-2 border-b last:border-b-0"
            >
              <span className="text-sm min-w-[80px]">{entry.nome}</span>
              <div className="flex-1">
                <ProgressBar
                  percent={entry.percent}
                  urgency={getUrgencyFromPercent(entry.percent)}
                />
              </div>
              <span className="text-sm font-semibold whitespace-nowrap">
                {entry.percent}%
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {entry.pecas_separadas}/{entry.total_pecas} pecas
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {entry.num_cards} cards
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardBlock>
  )
}
