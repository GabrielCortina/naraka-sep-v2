'use client'

import { Package } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { CardData } from '../types'
import { COLUMN_ORDER } from '../lib/deadline-config'
import { KanbanColumn } from './kanban-column'
import { CompletedSection } from './completed-section'

interface KanbanBoardProps {
  cards: CardData[]
  onOpenModal: (cardKey: string) => void
  onAssign: (cardKey: string) => void
}

export function KanbanBoard({ cards, onOpenModal, onAssign }: KanbanBoardProps) {
  if (cards.length === 0) {
    return (
      <div className="bg-zinc-100 min-h-[calc(100vh-4rem)] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="font-semibold text-lg">Nenhum pedido para separar</h2>
          <p className="text-muted-foreground mt-1">
            Faca o upload da planilha ERP para comecar a separacao.
          </p>
        </div>
      </div>
    )
  }

  const completed = cards.filter((c) => c.urgency === 'done')
  const active = cards.filter((c) => c.urgency !== 'done')

  const byGroup = new Map<string, CardData[]>()
  for (const card of active) {
    const group = byGroup.get(card.grupo_envio)
    if (group) {
      group.push(card)
    } else {
      byGroup.set(card.grupo_envio, [card])
    }
  }

  const visibleColumns = COLUMN_ORDER.filter((g) => byGroup.has(g))

  return (
    <div className="bg-zinc-100 min-h-[calc(100vh-4rem)] rounded-lg">
      {/* Desktop */}
      <div className="hidden md:block">
        <ScrollArea className="w-full">
          <div className="flex gap-6 p-4">
            {visibleColumns.map((grupo) => (
              <KanbanColumn
                key={grupo}
                grupoEnvio={grupo}
                cards={byGroup.get(grupo)!}
                onOpenModal={onOpenModal}
                onAssign={onAssign}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-3 p-4">
        {visibleColumns.map((grupo) => (
          <KanbanColumn
            key={grupo}
            grupoEnvio={grupo}
            cards={byGroup.get(grupo)!}
            onOpenModal={onOpenModal}
            onAssign={onAssign}
          />
        ))}
      </div>

      {/* Secao CONCLUIDOS */}
      <div className="px-4 pb-4">
        <CompletedSection
          cards={completed}
          onOpenModal={onOpenModal}
          onAssign={onAssign}
        />
      </div>
    </div>
  )
}
