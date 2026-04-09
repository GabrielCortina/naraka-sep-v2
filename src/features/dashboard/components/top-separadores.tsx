'use client'

import type { RankingEntry } from '../types'
import { DashboardBlock } from './dashboard-block'
import { PeriodFilter } from './period-filter'
import type { usePeriodFilter } from '../hooks/use-period-filter'

interface TopSeparadoresProps {
  entries: RankingEntry[]
  periodFilter: ReturnType<typeof usePeriodFilter>
}

const MEDALS: Record<number, string> = {
  1: '\u{1F947}',
  2: '\u{1F948}',
  3: '\u{1F949}',
}

export function TopSeparadores({ entries, periodFilter }: TopSeparadoresProps) {
  return (
    <DashboardBlock
      title="TOP SEPARADORES"
      headerRight={<PeriodFilter periodFilter={periodFilter} />}
    >
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum dado disponivel</p>
      ) : (
        <div>
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className="flex items-center gap-2 py-2 border-b last:border-b-0"
            >
              <span className="text-sm font-semibold w-6 text-right">
                {entry.position}
              </span>
              {MEDALS[entry.position] && (
                <span className="text-sm">{MEDALS[entry.position]}</span>
              )}
              <span className="text-sm flex-1">{entry.nome}</span>
              <span className="text-sm font-semibold">
                {entry.pecas_separadas} pecas
              </span>
              <span className="text-xs text-muted-foreground">
                {entry.cards_concluidos} cards
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardBlock>
  )
}
