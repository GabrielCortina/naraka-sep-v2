'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import type { CardData } from '../types'
import { MarketplaceBadge } from './marketplace-badge'
import { OrderCard } from './order-card'

interface KanbanColumnProps {
  grupoEnvio: string
  cards: CardData[]
  onOpenModal: (cardKey: string) => void
  onAssign: (cardKey: string) => void
}

const tierOrder: Record<string, number> = {
  overdue: 0,
  warning: 1,
  ok: 2,
  done: 3,
}

function sortByUrgency(cards: CardData[]): CardData[] {
  return [...cards].sort(
    (a, b) => (tierOrder[a.urgency] ?? 2) - (tierOrder[b.urgency] ?? 2),
  )
}

export function KanbanColumn({
  grupoEnvio,
  cards,
  onOpenModal,
  onAssign,
}: KanbanColumnProps) {
  const sorted = sortByUrgency(cards)
  const defaultOpen = cards.some(
    (c) => c.urgency === 'overdue' || c.urgency === 'warning',
  )
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block min-w-0">
        <div className="flex items-center gap-1 mb-2">
          <MarketplaceBadge grupoEnvio={grupoEnvio} />
          <span className="text-xs text-muted-foreground ml-1">
            ({cards.length})
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {sorted.map((card) => (
            <OrderCard
              key={card.card_key}
              card={card}
              onOpenModal={onOpenModal}
              onAssign={onAssign}
            />
          ))}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm cursor-pointer">
              <div className="flex items-center gap-2">
                <MarketplaceBadge grupoEnvio={grupoEnvio} />
                <span className="text-xs text-muted-foreground">
                  ({cards.length})
                </span>
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  'text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col gap-2 mt-2">
              {sorted.map((card) => (
                <OrderCard
                  key={card.card_key}
                  card={card}
                  onOpenModal={onOpenModal}
                  onAssign={onAssign}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  )
}
