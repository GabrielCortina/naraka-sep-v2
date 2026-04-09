'use client'

import type { ProgressaoMetodo } from '../types'
import { DEADLINES } from '@/features/cards/lib/deadline-config'

interface PedidosAtrasadosProps {
  progressao: ProgressaoMetodo[]
}

function getMsRemaining(grupoEnvio: string): number {
  const hour = DEADLINES[grupoEnvio]
  if (hour === undefined) return Infinity
  const now = new Date()
  const deadline = new Date(now)
  deadline.setHours(hour, 0, 0, 0)
  return deadline.getTime() - now.getTime()
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'vencido'
  const h = Math.floor(ms / (60 * 60 * 1000))
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  return `${h}h ${m}m`
}

function getColor(ms: number, percent: number): string {
  if (ms <= 0 || ms < 2 * 60 * 60 * 1000 || percent < 40) return '#E24B4A'
  return '#EF9F27'
}

export function PedidosAtrasados({ progressao }: PedidosAtrasadosProps) {
  const fourHours = 4 * 60 * 60 * 1000

  const atrasados = progressao.filter(p => {
    if (p.percent >= 70) return false
    const ms = getMsRemaining(p.grupo_envio)
    return ms < fourHours
  }).sort((a, b) => getMsRemaining(a.grupo_envio) - getMsRemaining(b.grupo_envio))

  if (atrasados.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-[#1D9E75]" />
        <p className="text-xs text-muted-foreground">Nenhum atraso critico</p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-2.5">
      {atrasados.map(entry => {
        const ms = getMsRemaining(entry.grupo_envio)
        const color = getColor(ms, entry.percent)

        return (
          <div key={entry.grupo_envio} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium truncate">
                {entry.grupo_envio}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] text-muted-foreground">
                corte em {formatTimeRemaining(ms)}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {entry.pecas_separadas}/{entry.total_pecas}
              </span>
              <span
                className="text-xs font-bold tabular-nums"
                style={{ color }}
              >
                {entry.percent}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
