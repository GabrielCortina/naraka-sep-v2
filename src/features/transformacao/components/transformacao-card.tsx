'use client'

import { Card, CardContent } from '@/components/ui/card'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransformacaoCardData } from '../types'
import { TYPE_ABBREV, DEADLINES } from '@/features/cards/lib/deadline-config'
import { formatCountdown } from '@/features/cards/lib/card-utils'
import { MarketplaceBadge } from '@/features/cards/components/marketplace-badge'
import { UrgencyBadge } from '@/features/cards/components/urgency-badge'
import { ProgressBar } from '@/features/cards/components/progress-bar'
import { TransformacaoBadge } from './transformacao-badge'
import type { UrgencyTier } from '@/features/cards/types'

interface TransformacaoCardProps {
  card: TransformacaoCardData
  onOpenModal: (cardKey: string, numero: number) => void
  onAssign: (cardKey: string, numero: number) => void
  userRole?: string
}

function getCountdown(grupoEnvio: string): string | null {
  const deadlineHour = DEADLINES[grupoEnvio]
  if (deadlineHour === undefined) return null
  const now = new Date()
  const deadline = new Date(now)
  deadline.setHours(deadlineHour, 0, 0, 0)
  return formatCountdown(deadline.getTime() - now.getTime())
}

function getUrgency(grupoEnvio: string, percent: number): UrgencyTier {
  if (percent === 100) return 'done'
  const deadlineHour = DEADLINES[grupoEnvio]
  if (deadlineHour === undefined) return 'ok'
  const now = new Date()
  const deadline = new Date(now)
  deadline.setHours(deadlineHour, 0, 0, 0)
  const diffMs = deadline.getTime() - now.getTime()
  if (diffMs <= 0) return 'overdue'
  if (diffMs <= 7200000) return 'warning'
  return 'ok'
}

export function TransformacaoCard({
  card,
  onOpenModal,
  onAssign,
  userRole,
}: TransformacaoCardProps) {
  const percent =
    card.total_pecas === 0
      ? 0
      : Math.round((card.pecas_concluidas / card.total_pecas) * 100)

  const countdown = getCountdown(card.grupo_envio)
  const urgency = getUrgency(card.grupo_envio, percent)
  const canAssign = userRole === 'admin' || userRole === 'lider'

  return (
    <Card
      className="border-l-4 border-l-purple-500 bg-white shadow-sm rounded-lg cursor-pointer"
      onClick={() => onOpenModal(card.card_key, card.numero_transformacao)}
    >
      <CardContent className="p-3">
        {/* Line 1: marketplace badge + transformacao badge + assign */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MarketplaceBadge grupoEnvio={card.grupo_envio} />
            <TransformacaoBadge />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (canAssign) {
                onAssign(card.card_key, card.numero_transformacao)
              }
            }}
            className={cn(
              'flex items-center gap-1 shrink-0',
              card.atribuido_a ? 'text-blue-600' : 'text-muted-foreground',
            )}
            aria-label="Atribuir separador"
          >
            <User size={14} />
            {card.atribuido_a && (
              <span className="text-[11px] font-bold max-w-[60px] truncate">
                {card.atribuido_a.nome}
              </span>
            )}
          </button>
        </div>

        {/* Line 2: type + import number + transformacao number */}
        <p className="text-xs text-muted-foreground mt-1">
          {TYPE_ABBREV[card.tipo] || card.tipo.toUpperCase()} #{card.importacao_numero} -- Transformacao #{card.numero_transformacao}
        </p>

        {/* Line 3: urgency badge */}
        <div className="mt-1.5">
          <UrgencyBadge urgency={urgency} countdown={countdown} />
        </div>

        {/* Line 4: progress bar */}
        <div className="mt-1.5">
          <ProgressBar percent={percent} urgency={percent > 0 ? 'ok' : urgency} />
        </div>

        {/* Line 5: percent + pecas */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold">{percent}%</span>
          <span className="text-xs text-muted-foreground">
            {card.pecas_concluidas}/{card.total_pecas} pecas
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
