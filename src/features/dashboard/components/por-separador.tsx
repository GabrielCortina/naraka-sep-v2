'use client'

import type { SeparadorProgress } from '../types'

interface PorSeparadorProps {
  entries: SeparadorProgress[]
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return nome.slice(0, 2).toUpperCase()
}

function getAvatarColor(nome: string): string {
  const colors = ['#378ADD', '#1D9E75', '#EF9F27', '#7F77DD', '#E24B4A', '#3B82F6', '#8B5CF6']
  let hash = 0
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getBarColor(percent: number, rank: number, total: number): string {
  const topHalf = total * 0.5
  const topThird = total * 0.7
  if (rank <= topHalf) return '#1D9E75'
  if (rank <= topThird) return '#EF9F27'
  return '#E24B4A'
}

export function PorSeparador({ entries }: PorSeparadorProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">Nenhum dado disponivel</p>
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) => b.pecas_separadas - a.pecas_separadas)
  const maxValue = sorted[0]?.pecas_separadas ?? 1

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      {sorted.map((entry, idx) => {
        const barWidth = maxValue > 0 ? Math.round((entry.pecas_separadas / maxValue) * 100) : 0
        const barColor = getBarColor(entry.percent, idx + 1, sorted.length)
        const avatarColor = getAvatarColor(entry.nome)

        return (
          <div key={entry.user_id} className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {getInitials(entry.nome)}
            </div>
            <span className="text-[11px] w-[80px] shrink-0 truncate">
              {entry.nome}
            </span>
            <div className="flex-1 h-3.5 bg-muted rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${barWidth}%`, backgroundColor: barColor }}
              />
            </div>
            <span className="text-[11px] tabular-nums whitespace-nowrap">
              {entry.pecas_separadas} pc
            </span>
          </div>
        )
      })}
    </div>
  )
}
