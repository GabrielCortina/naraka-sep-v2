'use client'

import type { RankingEntry } from '../types'

interface TopSeparadoresProps {
  entries: RankingEntry[]
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

export function TopSeparadores({ entries }: TopSeparadoresProps) {
  const top5 = entries.slice(0, 5)
  const maxValue = top5[0]?.pecas_separadas ?? 1

  if (top5.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">Nenhum dado disponivel</p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      {top5.map((entry) => {
        const barWidth = maxValue > 0 ? Math.round((entry.pecas_separadas / maxValue) * 100) : 0
        const avatarColor = getAvatarColor(entry.nome)

        return (
          <div key={entry.user_id} className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {getInitials(entry.nome)}
            </div>
            <span className="text-xs w-[90px] shrink-0 truncate">
              {entry.nome}
            </span>
            <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
              <div
                className="h-full rounded bg-[#378ADD] transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums whitespace-nowrap">
              {entry.pecas_separadas} pc
            </span>
          </div>
        )
      })}
    </div>
  )
}
