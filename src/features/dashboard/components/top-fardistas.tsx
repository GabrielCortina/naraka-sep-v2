'use client'

import type { RankingEntry } from '../types'
import { DashboardBlock } from './dashboard-block'

interface TopFardistasProps {
  entries: RankingEntry[]
}

const MEDALS: Record<number, string> = {
  1: '\u{1F947}',
  2: '\u{1F948}',
  3: '\u{1F949}',
}

export function TopFardistas({ entries }: TopFardistasProps) {
  return (
    <DashboardBlock title="TOP FARDISTAS">
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
                {entry.fardos_confirmados} fardos
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardBlock>
  )
}
