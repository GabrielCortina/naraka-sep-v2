'use client'

import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { FardoItem as FardoItemType } from '../types'

interface FardoItemProps {
  fardo: FardoItemType
  userRole: string
  selected: boolean
  onSelect: (id: string) => void
  onOk: (fardo: FardoItemType) => Promise<void>
  onNe: (fardo: FardoItemType) => Promise<void>
}

export function FardoItem({
  fardo,
  userRole,
  selected,
  onSelect,
  onOk,
  onNe,
}: FardoItemProps) {
  const [processing, setProcessing] = useState<'ok' | 'ne' | null>(null)

  const isLeader = userRole === 'admin' || userRole === 'lider'
  const isPendente = fardo.status === 'pendente'

  const bgClass =
    fardo.status === 'encontrado'
      ? 'bg-green-50'
      : fardo.status === 'nao_encontrado'
        ? 'bg-red-50'
        : 'bg-white'

  async function handleOk() {
    setProcessing('ok')
    try {
      await onOk(fardo)
    } catch {
      setProcessing(null)
    }
  }

  async function handleNe() {
    setProcessing('ne')
    try {
      await onNe(fardo)
    } catch {
      setProcessing(null)
    }
  }

  return (
    <div
      className={cn(
        'flex items-center p-4 rounded-lg shadow-sm border-l-[3px] border-blue-500 min-h-[80px] transition-colors duration-300',
        bgClass,
        selected && 'ring-2 ring-blue-500',
      )}
    >
      {/* Checkbox (admin/lider only) */}
      {isLeader && (
        <div className="flex items-center justify-center w-[44px] h-[44px] shrink-0 mr-2">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(fardo.reserva_id)}
            aria-label={`Selecionar fardo ${fardo.codigo_in}`}
            className="h-5 w-5"
          />
        </div>
      )}

      {/* Info central */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <span className="text-[16px] font-semibold truncate">{fardo.sku}</span>
        <span className="text-[14px] text-muted-foreground">
          ID: {fardo.codigo_in}
        </span>
        <span className="flex items-center gap-1 text-[14px]">
          <MapPin className="h-4 w-4 text-green-500 shrink-0" />
          <span className="truncate">{fardo.endereco}</span>
        </span>
        {fardo.status === 'encontrado' && (
          <Badge
            className="w-fit bg-green-500 text-white hover:bg-green-500"
            aria-live="polite"
          >
            Encontrado
          </Badge>
        )}
        {fardo.status === 'nao_encontrado' && (
          <Badge
            className="w-fit bg-red-500 text-white hover:bg-red-500"
            aria-live="polite"
          >
            Nao Encontrado
          </Badge>
        )}
      </div>

      {/* Quantidade */}
      <div className="flex flex-col items-end shrink-0 mr-4">
        <span className="text-[12px] text-muted-foreground uppercase">
          CONTEM
        </span>
        <span className="text-[24px] font-semibold leading-tight">
          {fardo.quantidade}
        </span>
      </div>

      {/* Botoes OK / N/E */}
      <div className="flex flex-col gap-2 shrink-0">
        <Button
          size="sm"
          className="bg-green-500 text-white hover:bg-green-600 min-h-[44px] min-w-[56px]"
          disabled={!isPendente || processing !== null}
          onClick={handleOk}
          aria-label={`Marcar fardo ${fardo.codigo_in} como encontrado`}
          style={!isPendente ? { opacity: 0.4 } : undefined}
        >
          {processing === 'ok' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'OK'
          )}
        </Button>
        <Button
          size="sm"
          className="bg-red-500 text-white hover:bg-red-600 min-h-[44px] min-w-[56px]"
          disabled={!isPendente || processing !== null}
          onClick={handleNe}
          aria-label={`Marcar fardo ${fardo.codigo_in} como nao encontrado`}
          style={!isPendente ? { opacity: 0.4 } : undefined}
        >
          {processing === 'ne' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'N/E'
          )}
        </Button>
      </div>
    </div>
  )
}
