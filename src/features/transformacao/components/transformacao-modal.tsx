'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

import type { TransformacaoCardData, TransformacaoItem } from '../types'
import { TYPE_ABBREV } from '@/features/cards/lib/deadline-config'
import { ProgressBar } from '@/features/cards/components/progress-bar'
import { NumpadPopup } from '@/features/cards/components/numpad-popup'

interface TransformacaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: TransformacaoCardData | null
  onConfirmQuantity: (transformacaoId: string, quantidade: number) => Promise<boolean>
  loadingItems?: Set<string>
}

export function TransformacaoModal({
  open,
  onOpenChange,
  card,
  onConfirmQuantity,
  loadingItems,
}: TransformacaoModalProps) {
  const [numpadOpen, setNumpadOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TransformacaoItem | null>(null)

  if (!card) return null

  const percent =
    card.total_pecas === 0
      ? 0
      : Math.round((card.pecas_concluidas / card.total_pecas) * 100)

  function openNumpad(item: TransformacaoItem) {
    setSelectedItem(item)
    setNumpadOpen(true)
  }

  async function handleNumpadConfirm(quantidade: number) {
    if (!selectedItem) return
    if (quantidade !== selectedItem.quantidade) {
      toast.error(`Quantidade deve ser exatamente ${selectedItem.quantidade}`)
      return
    }
    const success = await onConfirmQuantity(selectedItem.id, quantidade)
    if (success) {
      toast.success(`Transformacao concluida: ${selectedItem.sku}`)
    }
    setSelectedItem(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] p-0 gap-0 data-[state=open]:slide-in-from-bottom">
          <DialogHeader className="p-4 border-b pr-10">
            <DialogTitle>
              {card.grupo_envio} - {TYPE_ABBREV[card.tipo] || card.tipo.toUpperCase()} #{card.importacao_numero} -- Transf. #{card.numero_transformacao}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Itens de transformacao
            </DialogDescription>
            <div className="mt-2">
              <ProgressBar percent={percent} urgency="ok" />
              <div className="flex justify-between mt-1">
                <span className="text-xs font-bold">{percent}%</span>
                <span className="text-xs text-muted-foreground">
                  {card.pecas_concluidas}/{card.total_pecas} pecas
                </span>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="py-1">
              {card.items.map((item) => {
                const done = item.status === 'concluido'
                const itemLoading = loadingItems?.has(item.id) ?? false
                return (
                  <div
                    key={item.id}
                    className="flex items-stretch gap-3 py-3 border-b border-zinc-200 last:border-0 transition-opacity duration-300"
                  >
                    {/* Left colored border */}
                    <div
                      className={`w-1 rounded-full shrink-0 ${
                        done ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                    />

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        {/* Left: SKU + quantity */}
                        <div className="min-w-0 flex-1">
                          <span className="text-2xl font-bold block truncate">
                            {item.sku}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {done ? item.quantidade : 0}/{item.quantidade}
                          </p>
                        </div>

                        {/* Right: action/status */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!done && !itemLoading && (
                            <div className="text-right mr-1">
                              <span className="text-[10px] uppercase text-muted-foreground leading-none block">
                                Pegar
                              </span>
                              <span className="text-xl font-bold leading-tight">
                                {item.quantidade}
                              </span>
                            </div>
                          )}

                          {itemLoading ? (
                            <div className="flex items-center justify-center h-8 w-8">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : done ? (
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                              <Check className="h-5 w-5 text-green-600" />
                            </div>
                          ) : (
                            <button
                              onClick={() => openNumpad(item)}
                              className="flex items-center justify-center h-8 w-8 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <NumpadPopup
        open={numpadOpen}
        onOpenChange={setNumpadOpen}
        quantidadeNecessaria={selectedItem?.quantidade ?? 0}
        onConfirm={handleNumpadConfirm}
      />
    </>
  )
}
