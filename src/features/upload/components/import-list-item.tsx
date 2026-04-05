'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Trash2 } from 'lucide-react'
import type { ImportRecord } from '@/features/upload/types'

function formatHorario(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return iso
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

const TIPO_LABELS: Record<string, string> = {
  unitario: 'Unitarios',
  kit: 'Kits',
  combo: 'Combos',
}

interface ImportListItemProps {
  record: ImportRecord
  isLatest: boolean
  onUndo: () => void
  isProcessing: boolean
  index: number
}

export function ImportListItem({
  record,
  isLatest,
  onUndo,
  isProcessing,
  index,
}: ImportListItemProps) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-1 duration-200"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Lado esquerdo: info */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-base">
              #{record.importacao_numero}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatHorario(record.horario)}
            </span>
            <span className="text-sm text-muted-foreground">
              {record.total_pedidos} pedidos
            </span>
          </div>

          {/* Badges de tipo */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(record.por_tipo)
              .filter(([, count]) => count > 0)
              .map(([tipo, count]) => (
                <Badge key={tipo} variant="outline" className="text-xs">
                  {count} {TIPO_LABELS[tipo] ?? tipo}
                </Badge>
              ))}

            {/* Botao Desfazer */}
            {isLatest && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                onClick={onUndo}
                disabled={isProcessing}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Desfazer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
