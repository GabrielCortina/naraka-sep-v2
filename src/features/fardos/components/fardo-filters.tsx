'use client'

import { useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FardoFilters as FardoFiltersType } from '../types'

interface FardoFiltersProps {
  filters: FardoFiltersType
  onFiltersChange: (filters: FardoFiltersType) => void
  userRole: string
}

type StatusOption = FardoFiltersType['statusFilter']
type AssignOption = FardoFiltersType['assignFilter']

const STATUS_OPTIONS: { value: StatusOption; label: string }[] = [
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'encontrados', label: 'Encontrados' },
  { value: 'nao_encontrados', label: 'N/E' },
  { value: 'todos', label: 'Todos' },
]

const ASSIGN_OPTIONS: { value: AssignOption; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'atribuidos', label: 'Atribuidos' },
  { value: 'nao_atribuidos', label: 'Nao Atribuidos' },
]

export function FardoFilters({
  filters,
  onFiltersChange,
  userRole,
}: FardoFiltersProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onFiltersChange({ ...filters, search: value })
      }, 300)
    },
    [filters, onFiltersChange],
  )

  const isLeader = userRole === 'admin' || userRole === 'lider'

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      {/* Busca por codigo IN */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar codigo IN..."
          defaultValue={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtro por status */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <Badge
            key={opt.value}
            variant={filters.statusFilter === opt.value ? 'default' : 'outline'}
            className="cursor-pointer select-none"
            onClick={() =>
              onFiltersChange({ ...filters, statusFilter: opt.value })
            }
          >
            {opt.label}
          </Badge>
        ))}
      </div>

      {/* Filtro por atribuicao (so admin/lider) */}
      {isLeader && (
        <div className="flex flex-wrap gap-1.5">
          {ASSIGN_OPTIONS.map((opt) => (
            <Badge
              key={opt.value}
              variant={filters.assignFilter === opt.value ? 'default' : 'outline'}
              className="cursor-pointer select-none"
              onClick={() =>
                onFiltersChange({ ...filters, assignFilter: opt.value })
              }
            >
              {opt.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Ordenacao */}
      <Select
        value={filters.sortBy}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            sortBy: value as FardoFiltersType['sortBy'],
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="endereco">Endereco (A-Z)</SelectItem>
          <SelectItem value="sku">SKU (A-Z)</SelectItem>
          <SelectItem value="importacao">Importacao</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
