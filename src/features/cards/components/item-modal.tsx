'use client'

import { useState } from 'react'
import { Check, X, Printer } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

import type { CardData, CardItem } from '../types'
import { TYPE_ABBREV } from '../lib/deadline-config'
import { generateChecklist } from '../lib/pdf-generator'
import { ProgressBar } from './progress-bar'
import { NumpadPopup } from './numpad-popup'

interface ItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: CardData | null
  onConfirmQuantity: (cardKey: string, sku: string, quantidade: number) => void
  onNaoTem: (cardKey: string, sku: string) => void
}

export function ItemModal({
  open,
  onOpenChange,
  card,
  onConfirmQuantity,
  onNaoTem,
}: ItemModalProps) {
  const [numpadOpen, setNumpadOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CardItem | null>(null)

  if (!card) return null

  const sortedItems = [...card.items].sort((a, b) => {
    if (a.status === 'aguardar_fardista' && b.status !== 'aguardar_fardista') return 1
    if (a.status !== 'aguardar_fardista' && b.status === 'aguardar_fardista') return -1
    return 0
  })

  function openNumpad(item: CardItem) {
    setSelectedItem(item)
    setNumpadOpen(true)
  }

  function handleNumpadConfirm(quantidade: number) {
    if (selectedItem && card) {
      onConfirmQuantity(card.card_key, selectedItem.sku, quantidade)
    }
    setSelectedItem(null)
  }

  const isBlocked = (item: CardItem) => item.status === 'aguardar_fardista'
  const isDone = (item: CardItem) => item.status === 'separado'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] p-0 gap-0 data-[state=open]:slide-in-from-bottom">
          <DialogHeader className="p-4 border-b pr-10">
            <DialogTitle className="flex items-center gap-2">
              <span>{card.grupo_envio} - {TYPE_ABBREV[card.tipo] || card.tipo} #{card.importacao_numero}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  generateChecklist(card)
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent/50 shrink-0"
                aria-label="Imprimir checklist"
              >
                <Printer className="h-4 w-4" />
              </button>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Lista de itens do card para separacao
            </DialogDescription>
            <div className="mt-2">
              <ProgressBar
                percent={card.total_pecas === 0 ? 0 : Math.round((card.pecas_separadas / card.total_pecas) * 100)}
                urgency={card.urgency}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs font-bold">
                  {card.total_pecas === 0 ? 0 : Math.round((card.pecas_separadas / card.total_pecas) * 100)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {card.pecas_separadas}/{card.total_pecas} peças
                </span>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="py-1">
              {sortedItems.map((item) => {
                const blocked = isBlocked(item)
                const done = isDone(item)
                return (
                  <div
                    key={item.sku}
                    className={`flex items-stretch gap-3 py-3 border-b border-zinc-200 last:border-0 ${
                      blocked ? 'bg-zinc-50' : ''
                    }`}
                  >
                    {/* Borda lateral colorida */}
                    <div
                      className={`w-1 rounded-full shrink-0 ${
                        done
                          ? 'bg-green-500'
                          : blocked
                            ? 'bg-zinc-300'
                            : 'bg-blue-500'
                      }`}
                    />

                    {/* Conteúdo principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        {/* Esquerda: SKU + detalhes */}
                        <div className="min-w-0 flex-1">
                          <span className="text-base font-bold block truncate">
                            {item.sku}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.quantidade_separada}/{item.quantidade_necessaria} separado
                          </p>
                          {item.reservas.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.reservas.map((reserva) => (
                                <span
                                  key={reserva.codigo_in}
                                  className="inline-flex items-center text-[11px] text-muted-foreground bg-zinc-100 rounded px-1.5 py-0.5"
                                >
                                  Fardo {reserva.codigo_in} - {reserva.quantidade}un
                                  {reserva.endereco ? ` (${reserva.endereco})` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          {blocked && (
                            <Badge variant="outline" className="text-[10px] mt-1 border-amber-300 text-amber-700 bg-amber-50">
                              AGUARDAR FARDISTA
                            </Badge>
                          )}
                          {item.status === 'parcial' && (
                            <Badge variant="secondary" className="text-[10px] mt-1">
                              PARCIAL
                            </Badge>
                          )}
                          {item.status === 'nao_encontrado' && (
                            <Badge variant="destructive" className="text-[10px] mt-1">
                              NÃO ENCONTRADO
                            </Badge>
                          )}
                        </div>

                        {/* Direita: quantidade PEGAR + botões */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!done && (
                            <div className="text-right mr-1">
                              <span className="text-[10px] uppercase text-muted-foreground leading-none block">
                                Pegar
                              </span>
                              <span className="text-xl font-bold leading-tight">
                                {item.quantidade_necessaria}
                              </span>
                            </div>
                          )}

                          {done ? (
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => openNumpad(item)}
                                disabled={blocked}
                                className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onNaoTem(card.card_key, item.sku)}
                                disabled={blocked}
                                className="flex items-center justify-center h-8 w-8 rounded-md border border-zinc-300 text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
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
        quantidadeNecessaria={selectedItem?.quantidade_necessaria ?? 0}
        onConfirm={handleNumpadConfirm}
      />
    </>
  )
}
