'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { BaixadoItem } from '../lib/baixa-utils'

interface BaixadosHojeProps {
  items: BaixadoItem[]
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatEntregas(entregas: BaixadoItem['entregas']): string {
  if (entregas.length === 0) return 'N/A'
  return entregas
    .map((e) => e.separador_nome || 'N/A')
    .join(', ')
}

export function BaixadosHoje({ items }: BaixadosHojeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const prevLengthRef = useRef(items.length)

  // Auto-expand when items go from 0 to >= 1 (D-15)
  useEffect(() => {
    if (prevLengthRef.current === 0 && items.length >= 1) {
      setIsOpen(true)
    }
    prevLengthRef.current = items.length
  }, [items.length])

  return (
    <div className="w-[80%] md:w-[50%] bg-secondary rounded-lg overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold uppercase">
            BAIXADOS HOJE ({items.length})
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y">
            {items.map((item, idx) => (
              <div key={`${item.codigo_in}-${idx}`} className="py-2 px-4">
                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="text-sm">
                    {item.codigo_in} | {item.sku} | {item.quantidade}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Para: {formatEntregas(item.entregas)} | {formatTime(item.baixado_em)}
                  </div>
                </div>
                {/* Desktop layout */}
                <div className="hidden md:flex md:items-center md:gap-4 text-sm">
                  <span className="font-medium min-w-[100px]">{item.codigo_in}</span>
                  <span className="min-w-[100px]">{item.sku}</span>
                  <span className="min-w-[40px]">{item.quantidade}</span>
                  <span className="flex-1 truncate">{formatEntregas(item.entregas)}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(item.baixado_em)}</span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
