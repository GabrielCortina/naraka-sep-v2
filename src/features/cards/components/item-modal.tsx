'use client'

import { useState } from 'react'
import { Check, Printer } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
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
            <div className="py-2">
              {sortedItems.map((item) => (
                <div
                  key={item.sku}
                  className="py-3 border-b last:border-0"
                >
                  {/* Linha 1: SKU à esquerda, quantidade necessária à direita */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{item.sku}</span>
                    <span className="text-sm font-bold">{item.quantidade_necessaria}</span>
                  </div>

                  {/* Linha 2: progresso atual */}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.quantidade_separada}/{item.quantidade_necessaria}
                  </p>

                  {/* Linha 3: fardos reservados */}
                  {item.reservas.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {item.reservas.map((reserva) => (
                        <p
                          key={reserva.codigo_in}
                          className="text-xs text-muted-foreground"
                        >
                          Fardo {reserva.codigo_in} - {reserva.quantidade} un
                          {reserva.endereco ? ` (${reserva.endereco})` : ''}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Badges de status */}
                  {isBlocked(item) && (
                    <Badge variant="outline" className="text-xs w-fit mt-1">
                      AGUARDAR FARDISTA
                    </Badge>
                  )}
                  {item.status === 'parcial' && (
                    <Badge variant="secondary" className="text-xs w-fit mt-1">
                      Parcial
                    </Badge>
                  )}
                  {item.status === 'nao_encontrado' && (
                    <Badge variant="destructive" className="text-xs w-fit mt-1">
                      Nao encontrado
                    </Badge>
                  )}

                  {/* Botões de ação */}
                  <div className="flex items-center gap-2 mt-2">
                    {isDone(item) ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNumpad(item)}
                          disabled={isBlocked(item)}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onNaoTem(card.card_key, item.sku)}
                          disabled={isBlocked(item)}
                        >
                          Nao Tem
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
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
