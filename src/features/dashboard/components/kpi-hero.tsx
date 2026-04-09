'use client'

import type { ComparacaoData } from '../types'

interface KpiHeroProps {
  pecasSeparadas: number
  comparacao: ComparacaoData | null
}

export function KpiHero({ pecasSeparadas, comparacao }: KpiHeroProps) {
  const ontem = comparacao?.pecas_separadas_ontem ?? 0
  const diff = ontem > 0 ? pecasSeparadas - ontem : 0
  const percentDiff = ontem > 0 ? Math.round((diff / ontem) * 100) : 0
  const isUp = diff >= 0

  return (
    <div className="bg-card border rounded-xl p-6 text-center">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Total de pecas separadas
      </p>
      <p className="text-5xl font-light tabular-nums leading-none">
        {pecasSeparadas.toLocaleString('pt-BR')}
      </p>

      {ontem > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded ${
              isUp
                ? 'bg-[#1D9E75]/15 text-[#1D9E75]'
                : 'bg-[#E24B4A]/15 text-[#E24B4A]'
            }`}
          >
            {isUp ? '▲' : '▼'} {Math.abs(percentDiff)}%
          </span>
          <span className="text-xs text-muted-foreground">
            vs ontem ({ontem.toLocaleString('pt-BR')} pecas)
          </span>
        </div>
      )}
    </div>
  )
}
