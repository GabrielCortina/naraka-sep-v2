'use client'

import type { RankingEntry } from '../types'

interface TopFardistasProps {
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

function getNeColor(nePercent: number): string | null {
  if (nePercent > 20) return '#E24B4A'
  if (nePercent > 10) return '#EF9F27'
  return null
}

export function TopFardistas({ entries }: TopFardistasProps) {
  const top5 = entries.slice(0, 5)
  const maxValue = top5[0]?.fardos_confirmados ?? 1
  const hasAnyNe = top5.some(e => e.fardos_ne > 0)

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
        const barWidth = maxValue > 0 ? Math.round((entry.fardos_confirmados / maxValue) * 100) : 0
        const avatarColor = getAvatarColor(entry.nome || entry.user_id)
        const total = entry.fardos_confirmados + entry.fardos_ne
        const nePercent = total > 0 ? Math.round((entry.fardos_ne / total) * 100) : 0
        const neColor = getNeColor(nePercent)

        return (
          <div key={entry.user_id} className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {getInitials(entry.nome || entry.user_id.slice(0, 2))}
            </div>
            <span className="text-xs w-[70px] shrink-0 truncate">
              {entry.nome || entry.user_id.slice(0, 8)}
            </span>
            <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
              <div
                className="h-full rounded bg-[#1D9E75] transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium tabular-nums whitespace-nowrap text-[#1D9E75]">
                {entry.fardos_confirmados} OK
              </span>
              <span
                className="text-[10px] tabular-nums whitespace-nowrap"
                style={{ color: neColor ?? undefined }}
              >
                {entry.fardos_ne} NE
              </span>
              {neColor && (
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ color: neColor }}
                >
                  {nePercent}%
                </span>
              )}
            </div>
          </div>
        )
      })}

      {hasAnyNe && (
        <p className="text-[10px] text-muted-foreground pt-1 border-t">
          N/E acima de 10% indica atencao
        </p>
      )}
    </div>
  )
}
