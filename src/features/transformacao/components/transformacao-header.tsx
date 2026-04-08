'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TransformacaoHeaderProps {
  pendentes: number
  atribuidos: number
  concluidos: number
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function TransformacaoHeader({
  pendentes,
  atribuidos,
  concluidos,
  searchTerm,
  onSearchChange,
}: TransformacaoHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
      {/* Counters */}
      <div className="flex items-center gap-1 flex-wrap text-sm">
        <span className="font-semibold text-base">{pendentes}</span>
        <span>pendentes</span>
        <span className="mx-1">|</span>
        <span className="font-semibold text-base">{atribuidos}</span>
        <span>atribuidos</span>
        <span className="mx-1">|</span>
        <span className="font-semibold text-base">{concluidos}</span>
        <span>concluidos</span>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por SKU..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar por SKU"
        />
      </div>
    </div>
  )
}
