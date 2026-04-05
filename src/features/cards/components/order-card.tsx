'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import type { CardData } from '../types'
import { TYPE_ABBREV } from '../lib/deadline-config'
import { formatCountdown } from '../lib/card-utils'
import { DEADLINES } from '../lib/deadline-config'
import { MarketplaceBadge } from './marketplace-badge'
import { UrgencyBadge } from './urgency-badge'
import { ProgressBar } from './progress-bar'

interface OrderCardProps {
  card: CardData
  onOpenModal: (cardKey: string) => void
  onAssign: (cardKey: string) => void
}

const urgencyBorderMap: Record<string, string> = {
  overdue: 'border-l-urgency-overdue',
  warning: 'border-l-urgency-warning',
  ok: 'border-l-urgency-ok',
  done: 'border-l-urgency-ok/40',
}

function getCountdown(grupoEnvio: string): string | null {
  const deadlineHour = DEADLINES[grupoEnvio]
  if (deadlineHour === undefined) return null
  const now = new Date()
  const deadline = new Date(now)
  deadline.setHours(deadlineHour, 0, 0, 0)
  return formatCountdown(deadline.getTime() - now.getTime())
}

export function OrderCard({ card, onOpenModal, onAssign }: OrderCardProps) {
  const percent =
    card.total_pecas === 0
      ? 0
      : Math.round((card.pecas_separadas / card.total_pecas) * 100)

  const countdown = getCountdown(card.grupo_envio)

  return (
    <Card
      className={cn(
        'border-l-4 bg-white shadow-sm rounded-lg cursor-pointer',
        urgencyBorderMap[card.urgency],
      )}
      onClick={() => onOpenModal(card.card_key)}
    >
      <CardContent className="p-3">
        {/* Linha 1: marketplace + tipo + importacao + spacer + atribuir */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <MarketplaceBadge grupoEnvio={card.grupo_envio} />
            <span className="text-xs font-bold text-muted-foreground">
              {TYPE_ABBREV[card.tipo] || card.tipo.toUpperCase()}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              #{card.importacao_numero}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAssign(card.card_key)
            }}
            className={cn(
              'flex items-center gap-1 shrink-0',
              card.atribuido_a ? 'text-blue-600' : 'text-muted-foreground',
            )}
          >
            <User size={16} />
            {card.atribuido_a && (
              <span className="text-xs font-bold max-w-[60px] truncate">
                {card.atribuido_a.nome}
              </span>
            )}
          </button>
        </div>

        {/* Linha 2: urgency badge */}
        <div className="mt-1">
          <UrgencyBadge urgency={card.urgency} countdown={countdown} />
        </div>

        {/* Linha 3: progress bar */}
        <div className="mt-1">
          <ProgressBar percent={percent} urgency={card.urgency} />
        </div>

        {/* Linha 4: percent + pecas */}
        <div className="flex justify-between mt-1">
          <span className="text-xs font-bold">{percent}%</span>
          <span className="text-xs text-muted-foreground">
            {card.pecas_separadas}/{card.total_pecas} pecas
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
