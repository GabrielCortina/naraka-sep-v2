'use client'

import { useState, useEffect, useMemo } from 'react'
import { Repeat, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useTransformacaoData } from '@/features/transformacao/hooks/use-transformacao-data'
import { TransformacaoHeader } from '@/features/transformacao/components/transformacao-header'
import { TransformacaoCard } from '@/features/transformacao/components/transformacao-card'
import { TransformacaoModal } from '@/features/transformacao/components/transformacao-modal'
import { CompletedSection } from '@/features/cards/components/completed-section'
import { AssignModal } from '@/features/cards/components/assign-modal'
import { MarketplaceBadge } from '@/features/cards/components/marketplace-badge'
import { COLUMN_ORDER } from '@/features/cards/lib/deadline-config'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import type { TransformacaoCardData } from '@/features/transformacao/types'

interface TransformacaoClientProps {
  userId: string
  userRole: string
  userName: string
}

export function TransformacaoClient({
  userId,
  userRole,
}: TransformacaoClientProps) {
  const { cards, loading, error } = useTransformacaoData(userId, userRole)

  // Modal state
  const [selectedCard, setSelectedCard] = useState<TransformacaoCardData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set())

  // Assign modal state
  const [assignCardKey, setAssignCardKey] = useState('')
  const [assignNumero, setAssignNumero] = useState(0)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  // Separadores list for AssignModal
  const [separadores, setSeparadores] = useState<{ id: string; nome: string }[]>([])

  // Search state with debounce
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Counters (D-19): computed from all cards before filtering
  const counters = useMemo(() => {
    let pendentes = 0, atribuidos = 0, concluidos = 0
    for (const card of cards) {
      if (card.status === 'concluido') concluidos++
      else if (card.status === 'atribuido') atribuidos++
      else pendentes++
    }
    return { pendentes, atribuidos, concluidos }
  }, [cards])

  // Search filter (D-20)
  const filteredCards = useMemo(() => {
    if (!debouncedSearch) return cards
    const term = debouncedSearch.toLowerCase()
    return cards.filter(card =>
      card.items.some(item => item.sku.toLowerCase().includes(term)),
    )
  }, [cards, debouncedSearch])

  // Split active vs completed
  const activeCards = useMemo(
    () => filteredCards.filter((c) => c.status !== 'concluido'),
    [filteredCards],
  )
  const completedCards = useMemo(
    () => filteredCards.filter((c) => c.status === 'concluido'),
    [filteredCards],
  )

  // Group active cards by grupo_envio
  const byGroup = useMemo(() => {
    const map = new Map<string, TransformacaoCardData[]>()
    for (const card of activeCards) {
      const group = map.get(card.grupo_envio)
      if (group) {
        group.push(card)
      } else {
        map.set(card.grupo_envio, [card])
      }
    }
    return map
  }, [activeCards])

  const visibleColumns = COLUMN_ORDER.filter((g) => byGroup.has(g))

  // Fetch separadores list
  useEffect(() => {
    async function fetchSeparadores() {
      const supabase = createClient()
      const { data } = await supabase
        .from('users')
        .select('id, nome')
        .eq('role', 'separador')
        .eq('ativo', true)
      if (data) setSeparadores(data)
    }
    fetchSeparadores()
  }, [])

  // Realtime toast for lider (D-13)
  useEffect(() => {
    if (userRole !== 'lider' && userRole !== 'admin') return
    const supabase = createClient()
    const channel = supabase
      .channel('transformacao-new-card-toast')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transformacoes' },
        (payload) => {
          const row = payload.new as { card_key: string; numero_transformacao: number }
          if (row.numero_transformacao > 1) {
            const parts = row.card_key.split('|')
            toast.info(`Nova transformacao criada: ${parts[0]} ${parts[1]} #${parts[2]} -- Transformacao #${row.numero_transformacao}`)
          } else {
            toast.info(`Nova transformacao criada: ${row.card_key}`)
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userRole])

  // Keep selectedCard in sync with realtime updates
  useEffect(() => {
    if (selectedCard) {
      const updated = cards.find(
        (c) =>
          c.card_key === selectedCard.card_key &&
          c.numero_transformacao === selectedCard.numero_transformacao,
      )
      if (updated) setSelectedCard(updated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards])

  function handleOpenModal(cardKey: string, numero: number) {
    const card = cards.find(
      (c) => c.card_key === cardKey && c.numero_transformacao === numero,
    )
    if (card) {
      setSelectedCard(card)
      setModalOpen(true)
    }
  }

  function handleAssign(cardKey: string, numero: number) {
    setAssignCardKey(cardKey)
    setAssignNumero(numero)
    setAssignModalOpen(true)
  }

  async function handleAssignUser(cardKey: string, assignUserId: string) {
    const response = await fetch('/api/transformacao/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_key: cardKey,
        numero_transformacao: assignNumero,
        user_id: assignUserId,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      console.error('Erro ao atribuir separador:', data.error)
      toast.error(data.error || 'Erro ao atribuir separador')
    }
  }

  async function handleConfirmQuantity(
    transformacaoId: string,
    quantidade: number,
  ): Promise<boolean> {
    setLoadingItems((prev) => new Set(prev).add(transformacaoId))
    try {
      const response = await fetch('/api/transformacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transformacao_id: transformacaoId,
          quantidade,
        }),
      })

      if (response.ok) {
        return true
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao confirmar transformacao. Tente novamente.')
        return false
      }
    } catch {
      toast.error('Erro ao confirmar transformacao. Tente novamente.')
      return false
    } finally {
      setLoadingItems((prev) => {
        const next = new Set(prev)
        next.delete(transformacaoId)
        return next
      })
    }
  }

  // Find current assigned user for assign modal
  const assignCard = cards.find(
    (c) => c.card_key === assignCardKey && c.numero_transformacao === assignNumero,
  )
  const currentAssignedId = assignCard?.atribuido_a?.id ?? null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Carregando transformacoes...</p>
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

  if (cards.length === 0) {
    return (
      <div className="bg-zinc-100 min-h-[calc(100vh-4rem)] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Repeat size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="font-semibold text-lg">Nenhuma transformacao pendente</h2>
          <p className="text-muted-foreground mt-1">
            Itens aparecerao aqui quando a cascata nao encontrar fardo disponivel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <TransformacaoHeader
        pendentes={counters.pendentes}
        atribuidos={counters.atribuidos}
        concluidos={counters.concluidos}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="bg-zinc-100 min-h-[calc(100vh-4rem)] rounded-lg">
        {/* Desktop kanban */}
        {visibleColumns.length > 0 && (
          <div className="hidden md:block p-4">
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${visibleColumns.length}, 1fr)`,
              }}
            >
              {visibleColumns.map((grupo) => {
                const groupCards = byGroup.get(grupo)!
                return (
                  <div key={grupo} className="min-w-0">
                    <div className="flex items-center gap-1 mb-2">
                      <MarketplaceBadge grupoEnvio={grupo} />
                      <span className="text-xs text-muted-foreground ml-1">
                        ({groupCards.length})
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {groupCards.map((card) => (
                        <TransformacaoCard
                          key={`${card.card_key}-${card.numero_transformacao}`}
                          card={card}
                          onOpenModal={handleOpenModal}
                          onAssign={handleAssign}
                          userRole={userRole}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mobile collapsible columns */}
        {visibleColumns.length > 0 && (
          <div className="md:hidden flex flex-col gap-3 p-4">
            {visibleColumns.map((grupo) => {
              const groupCards = byGroup.get(grupo)!
              return (
                <MobileColumn
                  key={grupo}
                  grupo={grupo}
                  cards={groupCards}
                  onOpenModal={handleOpenModal}
                  onAssign={handleAssign}
                  userRole={userRole}
                />
              )
            })}
          </div>
        )}

        {/* Completed section (D-17: reusing CompletedSection with cardRenderer) */}
        {completedCards.length > 0 && (
          <div className="px-4 pb-4">
            <CompletedSection
              cards={completedCards}
              onOpenModal={(cardKey: string, numero: number) => handleOpenModal(cardKey, numero)}
              onAssign={(cardKey: string, numero: number) => handleAssign(cardKey, numero)}
              userRole={userRole}
              cardRenderer={(card, props) => (
                <TransformacaoCard
                  key={`${card.card_key}-${card.numero_transformacao}`}
                  card={card}
                  onOpenModal={props.onOpenModal}
                  onAssign={props.onAssign}
                  userRole={props.userRole}
                />
              )}
            />
          </div>
        )}
      </div>

      <TransformacaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        card={selectedCard}
        onConfirmQuantity={handleConfirmQuantity}
        loadingItems={loadingItems}
        userRole={userRole}
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

/** Mobile collapsible column for a grupo_envio */
function MobileColumn({
  grupo,
  cards,
  onOpenModal,
  onAssign,
  userRole,
}: {
  grupo: string
  cards: TransformacaoCardData[]
  onOpenModal: (cardKey: string, numero: number) => void
  onAssign: (cardKey: string, numero: number) => void
  userRole: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm cursor-pointer">
          <div className="flex items-center gap-2">
            <MarketplaceBadge grupoEnvio={grupo} />
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
          {cards.map((card) => (
            <TransformacaoCard
              key={`${card.card_key}-${card.numero_transformacao}`}
              card={card}
              onOpenModal={onOpenModal}
              onAssign={onAssign}
              userRole={userRole}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
