'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { RefreshCw, CheckSquare, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { FardoCounters } from './fardo-counters'
import { FardoFilters } from './fardo-filters'
import { FardoItem } from './fardo-item'
import { SelectionBar } from './selection-bar'
import { AssignModal } from '@/features/cards/components/assign-modal'
import { generateFardosPdf } from '../lib/fardo-pdf-generator'
import type { FardoItem as FardoItemType, FardoFilters as FardoFiltersType, FardoCounters as FardoCountersType } from '../types'

interface FardoListProps {
  fardos: FardoItemType[]
  counters: FardoCountersType
  userRole: string
  userId: string
  userName: string
  onRefetch: () => void
}

export function FardoList({
  fardos,
  counters,
  userRole,
  userId,
  userName,
  onRefetch,
}: FardoListProps) {
  const isLeader = userRole === 'admin' || userRole === 'lider'

  const [filters, setFilters] = useState<FardoFiltersType>({
    search: '',
    statusFilter: 'pendentes',
    assignFilter: 'todos',
    sortBy: 'endereco',
  })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [fardistas, setFardistas] = useState<{ id: string; nome: string }[]>([])
  const [syncing, setSyncing] = useState(false)

  // Fetch fardistas for assign modal
  useEffect(() => {
    if (!isLeader) return
    async function fetchFardistas() {
      const supabase = createClient()
      const { data } = await supabase
        .from('users')
        .select('id, nome')
        .eq('role', 'fardista')
        .eq('ativo', true)
      if (data) setFardistas(data)
    }
    fetchFardistas()
  }, [isLeader])

  // Filtering
  const filteredFardos = useMemo(() => {
    let result = fardos

    // Search by codigo_in
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter((f) =>
        f.codigo_in.toLowerCase().includes(q),
      )
    }

    // Status filter
    if (filters.statusFilter !== 'todos') {
      const statusMap: Record<string, string> = {
        pendentes: 'pendente',
        encontrados: 'encontrado',
        nao_encontrados: 'nao_encontrado',
      }
      const target = statusMap[filters.statusFilter]
      result = result.filter((f) => f.status === target)
    }

    // Assign filter
    if (filters.assignFilter === 'atribuidos') {
      result = result.filter((f) => f.fardista_id !== null)
    } else if (filters.assignFilter === 'nao_atribuidos') {
      result = result.filter((f) => f.fardista_id === null)
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (filters.sortBy === 'endereco') {
        return a.endereco.localeCompare(b.endereco)
      }
      if (filters.sortBy === 'sku') {
        return a.sku.localeCompare(b.sku)
      }
      return a.importacao_numero - b.importacao_numero
    })

    return result
  }, [fardos, filters])

  // Handlers
  const handleOk = useCallback(
    async (fardo: FardoItemType) => {
      const response = await fetch('/api/fardos/ok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reserva_id: fardo.reserva_id,
          codigo_in: fardo.codigo_in,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erro ao processar fardo. Tente novamente.')
        throw new Error(data.error)
      }

      toast.success(`Fardo ${fardo.codigo_in} encontrado`)
    },
    [],
  )

  const handleNe = useCallback(
    async (fardo: FardoItemType) => {
      const response = await fetch('/api/fardos/ne', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reserva_id: fardo.reserva_id,
          codigo_in: fardo.codigo_in,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erro ao processar fardo. Tente novamente.')
        throw new Error(data.error)
      }

      const result = await response.json()
      if (result.found_alternative) {
        toast.success(
          `Fardo ${fardo.codigo_in} substituido — novo fardo reservado`,
        )
      } else {
        toast.info(
          `Fardo ${fardo.codigo_in} nao encontrado — liberado para prateleira`,
        )
      }
    },
    [],
  )

  function handleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleSelectAll() {
    if (selectedIds.size === filteredFardos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredFardos.map((f) => f.reserva_id)))
    }
  }

  async function handleAssign(cardKey: string, assignUserId: string) {
    // Get unique card_keys from selected fardos
    const selectedFardos = fardos.filter((f) => selectedIds.has(f.reserva_id))
    const uniqueCardKeys = Array.from(
      new Set(selectedFardos.map((f) => f.card_key).filter(Boolean) as string[]),
    )

    if (uniqueCardKeys.length === 0) {
      toast.error('Nenhum card associado aos fardos selecionados')
      return
    }

    const response = await fetch('/api/fardos/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_keys: uniqueCardKeys,
        user_id: assignUserId,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      toast.error(data.error || 'Erro ao atribuir fardista')
      return
    }

    const targetUser = fardistas.find((u) => u.id === assignUserId)
    toast.success(
      `${uniqueCardKeys.length} fardos atribuidos para ${targetUser?.nome ?? 'fardista'}`,
    )
    setSelectedIds(new Set())
  }

  function handlePrint() {
    const toPrint =
      selectedIds.size > 0
        ? fardos.filter((f) => selectedIds.has(f.reserva_id))
        : filteredFardos
    generateFardosPdf(toPrint)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const response = await fetch('/api/fardos/sync', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erro ao sincronizar estoque')
        return
      }

      const result = await response.json()
      toast.success(
        `Estoque sincronizado — ${result.result?.fardos_reservados ?? 0} reservas atualizadas`,
      )
    } catch {
      toast.error('Erro ao sincronizar estoque')
    } finally {
      setSyncing(false)
    }
  }

  // Empty state
  if (fardos.length === 0) {
    const isFardista = userRole === 'fardista'
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <h2 className="text-lg font-semibold mb-2">
          {isFardista
            ? 'Nenhum fardo atribuido'
            : 'Nenhum fardo reservado. Faca upload de uma planilha para gerar reservas.'}
        </h2>
        {isFardista && (
          <p className="text-muted-foreground">
            Aguarde o lider atribuir fardos para voce.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[16px] font-semibold">Lista de Fardos</h1>
          <FardoCounters counters={counters} />
        </div>

        {isLeader && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw
                className={cn('h-4 w-4 mr-1', syncing && 'animate-spin')}
              />
              Sincronizar Estoque
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              <CheckSquare className="h-4 w-4 mr-1" />
              Selecionar Todos
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Imprimir Fardos
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <FardoFilters
        filters={filters}
        onFiltersChange={setFilters}
        userRole={userRole}
      />

      {/* List */}
      <div className="flex flex-col gap-3">
        {filteredFardos.map((fardo) => (
          <FardoItem
            key={fardo.reserva_id}
            fardo={fardo}
            userRole={userRole}
            selected={selectedIds.has(fardo.reserva_id)}
            onSelect={handleSelect}
            onOk={handleOk}
            onNe={handleNe}
          />
        ))}

        {filteredFardos.length === 0 && fardos.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum fardo encontrado com os filtros atuais.
          </div>
        )}
      </div>

      {/* Selection bar (admin/lider only) */}
      {isLeader && (
        <SelectionBar
          selectedCount={selectedIds.size}
          onAssign={() => setAssignModalOpen(true)}
          onPrint={handlePrint}
        />
      )}

      {/* Assign modal */}
      <AssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        cardKey="batch-assign"
        filterRole="fardista"
        users={fardistas}
        currentUserId={null}
        onAssign={handleAssign}
      />
    </div>
  )
}
