'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
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
    <div className="w-[80%] md:w-[50%]">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full px-1 py-3 text-sm font-bold">
            BAIXADOS HOJE ({items.length})
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={`${item.codigo_in}-${idx}`}
                className="bg-white rounded-lg shadow-sm border-l-[3px] border-green-500 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: fardo info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-lg font-bold block">{item.codigo_in}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.sku} · {item.quantidade} un
                    </p>
                    {item.endereco && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                        {item.endereco}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Entregue para: {formatEntregas(item.entregas)}
                    </p>
                  </div>

                  {/* Right: time */}
                  <span className="text-xs text-muted-foreground shrink-0 pt-1">
                    {formatTime(item.baixado_em)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
