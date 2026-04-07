'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { User, Trash2 } from 'lucide-react'
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
  onDelete?: (cardKey: string) => void
  userRole?: string
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

export function OrderCard({ card, onOpenModal, onAssign, onDelete, userRole }: OrderCardProps) {
  const canDelete = userRole === 'admin' || userRole === 'lider'
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
        {/* Linha 1: badge método de envio + botão atribuir */}
        <div className="flex items-center justify-between">
          <MarketplaceBadge grupoEnvio={card.grupo_envio} />
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
            <User size={14} />
            {card.atribuido_a && (
              <span className="text-[11px] font-bold max-w-[60px] truncate">
                {card.atribuido_a.nome}
              </span>
            )}
          </button>
        </div>

        {/* Linha 2: tipo + número importação */}
        <p className="text-xs text-muted-foreground mt-1">
          {TYPE_ABBREV[card.tipo] || card.tipo.toUpperCase()} #{card.importacao_numero}
        </p>

        {/* Linha 3: urgência / contagem regressiva */}
        <div className="mt-1.5">
          <UrgencyBadge urgency={card.urgency} countdown={countdown} />
        </div>

        {/* Linha 4: barra de progresso */}
        <div className="mt-1.5">
          <ProgressBar percent={percent} urgency={percent > 0 ? 'ok' : card.urgency} />
        </div>

        {/* Linha 5: percentual + peças + lixeira */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold">{percent}%</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {card.pecas_separadas}/{card.total_pecas} peças
            </span>
            {canDelete && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(card.card_key)
                }}
                className="text-zinc-400 hover:text-red-500 transition-colors p-0.5 rounded"
                aria-label="Excluir card"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
