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
import { OrderCard } from './order-card'

interface CompletedSectionProps {
  cards: CardData[]
  onOpenModal: (cardKey: string) => void
  onAssign: (cardKey: string) => void
}

export function CompletedSection({
  cards,
  onOpenModal,
  onAssign,
}: CompletedSectionProps) {
  const [open, setOpen] = useState(false)

  if (cards.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm mt-4 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="uppercase font-bold text-sm text-muted-foreground">
              CONCLUIDOS
            </span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
          {cards.map((card) => (
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
  )
}
