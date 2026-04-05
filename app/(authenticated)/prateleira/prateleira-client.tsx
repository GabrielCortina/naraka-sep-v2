'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCardData } from '@/features/cards/hooks/use-card-data'
import { KanbanBoard } from '@/features/cards/components/kanban-board'
import { ItemModal } from '@/features/cards/components/item-modal'
import { AssignModal } from '@/features/cards/components/assign-modal'
import type { CardData } from '@/features/cards/types'

interface PrateleiraClientProps {
  userId: string
  userRole: string
  userName: string
}

export function PrateleiraClient({
  userId,
  userRole,
}: PrateleiraClientProps) {
  const { cards, loading, error } = useCardData(userId, userRole)

  // State for ItemModal
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [itemModalOpen, setItemModalOpen] = useState(false)

  // State for AssignModal
  const [assignCardKey, setAssignCardKey] = useState<string>('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  // List of separadores for AssignModal
  const [separadores, setSeparadores] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    async function fetchSeparadores() {
      const supabase = createClient()
      const { data } = await supabase
        .from('users')
        .select('id, nome')
        .eq('role', 'separador')
        .eq('ativo', true)

      if (data) {
        setSeparadores(data)
      }
    }
    fetchSeparadores()
  }, [])

  function handleOpenModal(cardKey: string) {
    const card = cards.find((c) => c.card_key === cardKey)
    if (card) {
      setSelectedCard(card)
      setItemModalOpen(true)
    }
  }

  function handleAssign(cardKey: string) {
    setAssignCardKey(cardKey)
    setAssignModalOpen(true)
  }

  async function handleConfirmQuantity(
    _cardKey: string,
    sku: string,
    quantidade: number,
  ) {
    // Find pedido_ids for this SKU in the card
    const card = cards.find((c) => c.card_key === _cardKey)
    if (!card) return

    const item = card.items.find((i) => i.sku === sku)
    if (!item) return

    // Determine status based on quantity
    const status =
      quantidade >= item.quantidade_necessaria
        ? 'completo'
        : quantidade > 0
          ? 'parcial'
          : 'pendente'

    // Call API route for each pedido_id in this SKU group
    for (const pedidoId of item.pedido_ids) {
      const response = await fetch('/api/cards/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedidoId,
          quantidade_separada: quantidade,
          status,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Erro ao confirmar quantidade:', data.error)
        return
      }
    }
  }

  async function handleNaoTem(_cardKey: string, sku: string) {
    const card = cards.find((c) => c.card_key === _cardKey)
    if (!card) return

    const item = card.items.find((i) => i.sku === sku)
    if (!item) return

    for (const pedidoId of item.pedido_ids) {
      const response = await fetch('/api/cards/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedidoId,
          quantidade_separada: 0,
          status: 'nao_encontrado',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Erro ao marcar como nao encontrado:', data.error)
        return
      }
    }
  }

  async function handleAssignUser(cardKey: string, assignUserId: string) {
    const response = await fetch('/api/cards/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_key: cardKey,
        user_id: assignUserId,
        tipo: 'separador',
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      console.error('Erro ao atribuir separador:', data.error)
    }
  }

  // Find current assigned user for the assign modal card
  const assignCard = cards.find((c) => c.card_key === assignCardKey)
  const currentAssignedId = assignCard?.atribuido_a?.id ?? null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Carregando pedidos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <>
      <KanbanBoard
        cards={cards}
        onOpenModal={handleOpenModal}
        onAssign={handleAssign}
      />

      <ItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        card={selectedCard}
        onConfirmQuantity={handleConfirmQuantity}
        onNaoTem={handleNaoTem}
      />

      <AssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        cardKey={assignCardKey}
        filterRole="separador"
        users={separadores}
        currentUserId={currentAssignedId}
        onAssign={handleAssignUser}
      />
    </>
  )
}
