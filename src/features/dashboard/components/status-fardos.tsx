'use client'

import type { StatusFardosData } from '../types'

interface StatusFardosProps {
  statusFardos: StatusFardosData
}

const STATUS_BARS: { key: keyof StatusFardosData; label: string; color: string }[] = [
  { key: 'ok', label: 'OK', color: '#1D9E75' },
  { key: 'nao_encontrado', label: 'N/E', color: '#E24B4A' },
  { key: 'pendentes', label: 'Pendente', color: '#EF9F27' },
  { key: 'sem_atribuicao', label: 'Sem atribuicao', color: '#888780' },
]

export function StatusFardos({ statusFardos }: StatusFardosProps) {
  const total = statusFardos.total || 1
  const nePercent = statusFardos.total > 0
    ? Math.round((statusFardos.nao_encontrado / statusFardos.total) * 100)
    : 0

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      {STATUS_BARS.map(({ key, label, color }) => {
        const value = statusFardos[key]
        if (typeof value !== 'number') return null
        const pct = Math.round((value / total) * 100)

        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-[100px] shrink-0 text-right">
              {label}
            </span>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs font-medium w-8 text-right tabular-nums">
              {value}
            </span>
          </div>
        )
      })}

      {nePercent > 10 && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E24B4A]" />
          <span className="text-[10px] font-bold text-[#E24B4A]">
            Alta taxa de N/E ({nePercent}%)
          </span>
        </div>
      )}
    </div>
  )
}
