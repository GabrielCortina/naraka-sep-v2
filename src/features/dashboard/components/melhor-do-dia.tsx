'use client'

import type { RankingEntry } from '../types'

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

interface HeroCardProps {
  entry: RankingEntry | null
  role: 'separador' | 'fardista'
  metric: number
  metricLabel: string
  secondPlace: RankingEntry | null
  crownColor: string
}

function HeroCard({ entry, role, metric, metricLabel, secondPlace, crownColor }: HeroCardProps) {
  if (!entry) {
    return (
      <div className="bg-card border rounded-lg p-4 flex-1 flex items-center justify-center min-h-[120px]">
        <p className="text-xs text-muted-foreground">Sem dados</p>
      </div>
    )
  }

  const avatarColor = getAvatarColor(entry.nome)
  const advantage = secondPlace ? metric - (role === 'separador' ? secondPlace.pecas_separadas : secondPlace.fardos_confirmados) : 0

  return (
    <div className="bg-card border rounded-lg p-4 flex-1">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {getInitials(entry.nome)}
          </div>
          <span
            className="absolute -top-1.5 -right-1.5 text-sm"
            style={{ filter: `drop-shadow(0 0 2px ${crownColor})` }}
          >
            ★
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold truncate">
            {entry.nome}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {role === 'separador' ? 'Separador(a)' : 'Fardista'} · {metric.toLocaleString('pt-BR')} {metricLabel}
          </p>
          {advantage > 0 && secondPlace && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {advantage.toLocaleString('pt-BR')} {metricLabel} acima do 2° colocado
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface MelhorDoDiaFullProps {
  topSeparadores: RankingEntry[]
  topFardistas: RankingEntry[]
}

export function MelhorDoDia({ topSeparadores, topFardistas }: MelhorDoDiaFullProps) {
  const melhorSep = topSeparadores[0] ?? null
  const secondSep = topSeparadores[1] ?? null
  const melhorFard = topFardistas[0] ?? null
  const secondFard = topFardistas[1] ?? null

  return (
    <div className="flex gap-3">
      <HeroCard
        entry={melhorSep}
        role="separador"
        metric={melhorSep?.pecas_separadas ?? 0}
        metricLabel="pecas"
        secondPlace={secondSep}
        crownColor="#EF9F27"
      />
      <HeroCard
        entry={melhorFard}
        role="fardista"
        metric={melhorFard?.fardos_confirmados ?? 0}
        metricLabel="fardos"
        secondPlace={secondFard}
        crownColor="#1D9E75"
      />
    </div>
  )
}
