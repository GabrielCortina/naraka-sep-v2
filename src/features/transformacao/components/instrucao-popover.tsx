'use client'

import { useState } from 'react'
import { MessageSquare, Loader2, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import type { InstrucaoLider } from '../types'

const OPCOES: Array<{ value: InstrucaoLider; label: string; color: string }> = [
  { value: 'TRANSFORMACAO_LIBERADA', label: 'Transformacao Liberada', color: 'bg-green-500' },
  { value: 'SKU_VAI_CHEGAR', label: 'SKU Vai Chegar', color: 'bg-yellow-500' },
  { value: 'PEGAR_NA_VALERIA', label: 'Pegar na Valeria', color: 'bg-blue-500' },
  { value: 'PEGAR_NA_LOJA', label: 'Pegar na Loja', color: 'bg-purple-500' },
]

const COLOR_BORDER: Record<InstrucaoLider, string> = {
  TRANSFORMACAO_LIBERADA: 'border-green-500',
  SKU_VAI_CHEGAR: 'border-yellow-500',
  PEGAR_NA_VALERIA: 'border-blue-500',
  PEGAR_NA_LOJA: 'border-purple-500',
}

interface InstrucaoPopoverProps {
  transformacaoId: string
  instrucaoAtual: InstrucaoLider | null
  onInstrucaoChange?: (instrucao: InstrucaoLider | null) => void
}

export function InstrucaoPopover({ transformacaoId, instrucaoAtual, onInstrucaoChange }: InstrucaoPopoverProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSelect(opcao: InstrucaoLider) {
    setLoading(true)
    try {
      // If clicking already-selected option, send null to clear
      const instrucao = opcao === instrucaoAtual ? null : opcao

      const response = await fetch('/api/transformacao/instrucao', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transformacao_id: transformacaoId, instrucao }),
      })

      const data = await response.json()

      if (response.ok) {
        onInstrucaoChange?.(instrucao)
        toast.success(instrucao ? 'Instrucao definida' : 'Instrucao removida')
        setOpen(false)
      } else {
        toast.error(data.error || 'Erro ao definir instrucao')
      }
    } catch {
      toast.error('Erro ao definir instrucao')
    } finally {
      setLoading(false)
    }
  }

  const borderClass = instrucaoAtual ? COLOR_BORDER[instrucaoAtual] : 'border-zinc-300'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center justify-center h-7 w-7 rounded-md border ${borderClass} hover:bg-zinc-100 transition-colors`}
          aria-label="Definir instrucao"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          {OPCOES.map((opcao) => {
            const selected = opcao.value === instrucaoAtual
            return (
              <button
                key={opcao.value}
                onClick={() => handleSelect(opcao.value)}
                disabled={loading}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors ${
                  selected ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-50'
                }`}
              >
                <span className={`w-3 h-3 rounded-full shrink-0 ${opcao.color}`} />
                <span className="flex-1 text-left">{opcao.label}</span>
                {selected && <Check className="h-3.5 w-3.5 text-zinc-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
