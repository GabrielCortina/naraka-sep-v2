'use client'

import type { FardoCounters as FardoCountersType } from '../types'

interface FardoCountersProps {
  counters: FardoCountersType
}

export function FardoCounters({ counters }: FardoCountersProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>
        <span className="text-[16px] font-semibold">{counters.pendentes}</span>{' '}
        <span className="text-[12px] text-muted-foreground">pendentes</span>
      </span>
      <span className="text-muted-foreground">|</span>
      <span>
        <span className="text-[16px] font-semibold">{counters.encontrados}</span>{' '}
        <span className="text-[12px] text-muted-foreground">encontrados</span>
      </span>
      <span className="text-muted-foreground">|</span>
      <span>
        <span className="text-[16px] font-semibold">{counters.nao_encontrados}</span>{' '}
        <span className="text-[12px] text-muted-foreground">N/E</span>
      </span>
      <span className="text-muted-foreground">|</span>
      <span>
        <span className="text-[16px] font-semibold">{counters.baixados}</span>{' '}
        <span className="text-[12px] text-muted-foreground">baixados</span>
      </span>
    </div>
  )
}
