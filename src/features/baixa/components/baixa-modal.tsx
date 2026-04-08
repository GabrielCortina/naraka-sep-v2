'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2 } from 'lucide-react'
import type { BaixaFardoResult } from '../lib/baixa-utils'
import { getMarketplaceColor } from '../lib/baixa-utils'

interface BaixaModalProps {
  fardo: BaixaFardoResult | null
  open: boolean
  isConfirming: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function BaixaModal({
  fardo,
  open,
  isConfirming,
  onConfirm,
  onCancel,
}: BaixaModalProps) {
  if (!fardo) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}>
      <DialogContent
        className="max-w-[420px] sm:max-w-[420px]"
        style={{ borderTop: `4px solid ${fardo.marketplace_color || '#000'}` }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {fardo.codigo_in}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do fardo para confirmar baixa
          </DialogDescription>
        </DialogHeader>

        {/* SKU */}
        <p className="text-sm text-muted-foreground">{fardo.sku}</p>

        {/* Endereco with green pin (D-05) */}
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-4 w-4 text-green-500" />
          {fardo.endereco || 'Sem endereco'}
        </div>

        {/* Quantidade with CONTEM label (D-05) */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            CONTEM
          </p>
          <p className="text-2xl font-semibold">{fardo.quantidade}</p>
        </div>

        {/* Entregar Para section (D-09, D-12) */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground">
            Entregar para:
          </p>
          <div className="mt-2 max-h-[200px] overflow-y-auto space-y-0">
            {fardo.entregas.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2">
                Nenhum separador vinculado
              </p>
            ) : (
              fardo.entregas.map((entrega) => (
                <div
                  key={entrega.card_key}
                  className="flex flex-col py-2 pl-4 border-b"
                  style={{
                    borderLeft: `3px solid ${getMarketplaceColor(entrega.grupo_envio)}`,
                  }}
                >
                  <span className="text-sm font-semibold">
                    {entrega.separador_nome || (
                      <span className="italic">Nao atribuido</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entrega.card_key}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action buttons (D-07) */}
        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Confirmar Baixa'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isConfirming}
            className={`w-full h-11 ${isConfirming ? 'opacity-50' : ''}`}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
