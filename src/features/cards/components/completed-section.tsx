'use client'

import React, { useState } from 'react'
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cards: CardData[] | any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenModal: (...args: any[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAssign: (...args: any[]) => void
  onDelete?: (cardKey: string) => void
  userRole?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cardRenderer?: (card: any, props: { onOpenModal: (...args: any[]) => void; onAssign: (...args: any[]) => void; userRole?: string }) => React.ReactNode
}

export function CompletedSection({
  cards,
  onOpenModal,
  onAssign,
  onDelete,
  userRole,
  cardRenderer,
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
          {cards.map((card, index) =>
            cardRenderer ? (
              <React.Fragment key={card.card_key ?? index}>
                {cardRenderer(card, { onOpenModal, onAssign, userRole })}
              </React.Fragment>
            ) : (
              <OrderCard
                key={card.card_key}
                card={card as CardData}
                onOpenModal={onOpenModal}
                onAssign={onAssign}
                onDelete={onDelete}
                userRole={userRole}
              />
            ),
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
