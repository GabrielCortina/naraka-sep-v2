'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useCardData } from '@/features/cards/hooks/use-card-data'
import { KanbanBoard } from '@/features/cards/components/kanban-board'
import { ItemModal } from '@/features/cards/components/item-modal'
import { AssignModal } from '@/features/cards/components/assign-modal'
import { DeleteCardModal } from '@/features/cards/components/delete-card-modal'
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

  // State for DeleteCardModal
  const [deleteCardKey, setDeleteCardKey] = useState<string>('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // List of separadores for AssignModal
  const [separadores, setSeparadores] = useState<{ id: string; nome: string }[]>([])

  // Cascade loading state per SKU
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set())

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

  // Realtime toast for leader when cascade bale is created (D-15)
  useEffect(() => {
    if (userRole !== 'lider' && userRole !== 'admin') return

    const supabase = createClient()
    const channel = supabase
      .channel('prateleira-cascata-toast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trafego_fardos',
        },
        (payload) => {
          if (payload.new && (payload.new as Record<string, unknown>).is_cascata === true) {
            toast.info('Novo fardo de cascata adicionado -- atribuir fardista')
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userRole])

  function handleOpenModal(cardKey: string) {
    const card = cards.find((c) => c.card_key === cardKey)
    if (card) {
      setSelectedCard(card)
      setItemModalOpen(true)
    }
  }

  function handleDelete(cardKey: string) {
    setDeleteCardKey(cardKey)
    setDeleteModalOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleConfirmDelete(_cardKey: string, _pin: string) {
    // Backend logic deferred to Phase 07
    // Will call POST /api/cards/delete with cardKey + pin
    setDeleteModalOpen(false)
  }

  function handleAssign(cardKey: string) {
    setAssignCardKey(cardKey)
    setAssignModalOpen(true)
  }

  async function handleConfirmQuantity(
    cardKey: string,
    sku: string,
    quantidade: number,
  ) {
    const card = cards.find((c) => c.card_key === cardKey)
    if (!card) return

    const item = card.items.find((i) => i.sku === sku)
    if (!item) return

    if (quantidade >= item.quantidade_necessaria) {
      // Full confirm (PRAT-02) -- call /api/cards/progress as before
      const status = 'completo'
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
    } else {
      // Parcial (PRAT-03, D-02) -- call cascade API
      setLoadingItems((prev) => new Set(prev).add(sku))

      try {
        const response = await fetch('/api/prateleira/cascata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedido_ids: item.pedido_ids,
            sku: item.sku,
            quantidade_confirmada: quantidade,
            quantidade_restante: item.quantidade_necessaria - quantidade,
            tipo: 'parcial',
            card_key: card.card_key,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.found_alternative) {
            toast.success('Fardo alternativo reservado -- AGUARDAR FARDISTA')
          }
          if (data.transformacao) {
            toast.info('Sem fardo disponivel -- enviado para Transformacao')
          }
        } else {
          const data = await response.json()
          console.error('Erro na cascata:', data.error)
          toast.error(data.error || 'Erro ao processar cascata')
        }
      } finally {
        setLoadingItems((prev) => {
          const next = new Set(prev)
          next.delete(sku)
          return next
        })
      }
    }
  }

  async function handleNaoTem(cardKey: string, sku: string) {
    const card = cards.find((c) => c.card_key === cardKey)
    if (!card) return

    const item = card.items.find((i) => i.sku === sku)
    if (!item) return

    // NE (PRAT-04, D-03) -- call cascade API
    setLoadingItems((prev) => new Set(prev).add(sku))

    try {
      const response = await fetch('/api/prateleira/cascata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_ids: item.pedido_ids,
          sku: item.sku,
          quantidade_confirmada: 0,
          quantidade_restante: item.quantidade_necessaria,
          tipo: 'ne',
          card_key: card.card_key,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.found_alternative) {
          toast.success('Fardo alternativo reservado -- AGUARDAR FARDISTA')
        }
        if (data.transformacao) {
          toast.info('Sem fardo disponivel -- enviado para Transformacao')
        }
      } else {
        const data = await response.json()
        console.error('Erro na cascata:', data.error)
        toast.error(data.error || 'Erro ao processar cascata')
      }
    } finally {
      setLoadingItems((prev) => {
        const next = new Set(prev)
        next.delete(sku)
        return next
      })
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
        onDelete={handleDelete}
        userRole={userRole}
      />

      <ItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        card={selectedCard}
        onConfirmQuantity={handleConfirmQuantity}
        onNaoTem={handleNaoTem}
        loadingSkus={loadingItems}
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

      <DeleteCardModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        cardKey={deleteCardKey}
        cardLabel={(() => {
          const c = cards.find((x) => x.card_key === deleteCardKey)
          return c ? `${c.grupo_envio} - ${c.tipo.toUpperCase()} #${c.importacao_numero}` : ''
        })()}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
