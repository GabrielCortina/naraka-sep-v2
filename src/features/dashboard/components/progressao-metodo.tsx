'use client'

import type { ProgressaoMetodo as ProgressaoMetodoType } from '../types'
import { DEADLINES } from '@/features/cards/lib/deadline-config'

interface ProgressaoMetodoProps {
  progressao: ProgressaoMetodoType[]
}

function getBarColor(percent: number): string {
  if (percent === 100) return '#888780'
  if (percent >= 70) return '#1D9E75'
  if (percent >= 40) return '#EF9F27'
  return '#E24B4A'
}

function getPercentColor(percent: number): string {
  if (percent === 100) return '#888780'
  if (percent >= 70) return '#1D9E75'
  if (percent >= 40) return '#EF9F27'
  return '#E24B4A'
}

function getCutoffLabel(grupoEnvio: string): string | null {
  const hour = DEADLINES[grupoEnvio]
  if (hour === undefined) return null
  return `corte ${hour}h`
}

export function ProgressaoMetodo({ progressao }: ProgressaoMetodoProps) {
  if (progressao.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">Nenhum dado disponivel</p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      {progressao.map((entry) => {
        const barColor = getBarColor(entry.percent)
        const cutoff = getCutoffLabel(entry.grupo_envio)

        return (
          <div key={entry.grupo_envio} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {entry.grupo_envio}
                </span>
                {cutoff && (
                  <span className="text-[10px] text-muted-foreground">
                    {cutoff}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {entry.pecas_separadas}/{entry.total_pecas}
                </span>
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: getPercentColor(entry.percent) }}
                >
                  {entry.percent}%
                </span>
              </div>
            </div>
            <div className="h-3 bg-muted rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${entry.percent}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
