'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { ParseResult } from '@/features/upload/lib/parse-xlsx'
import type { ImportSummary, EstoqueSummary } from '@/features/upload/types'

interface ImportPreviewProps {
  parseResult: ParseResult
  summary: ImportSummary | null
  importacao_numero: number | null
  estoque: EstoqueSummary | null
  step: string
  onConfirm: () => void
  onReset: () => void
}

const TIPO_LABELS: Record<string, string> = {
  unitario: 'Unitarios',
  kit: 'Kits',
  combo: 'Combos',
}

export function ImportPreview({
  parseResult,
  summary,
  importacao_numero,
  estoque,
  step,
  onConfirm,
  onReset,
}: ImportPreviewProps) {
  const isConfirming = step === 'confirming'
  const isSuccess = step === 'success'

  // Contagem de pedidos unicos no preview local
  const uniqueOrders = new Set(parseResult.rows.map(r => r.numero_pedido)).size

  return (
    <Card className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-250">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {isSuccess ? `Importacao #${importacao_numero}` : 'Resumo da importacao'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado preview (pre-confirmacao) */}
        {!isSuccess && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{uniqueOrders}</p>
                <p className="text-sm text-muted-foreground">Pedidos validos</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{parseResult.filtered_envio}</p>
                <p className="text-sm text-muted-foreground">Filtrados (Full/Fulfillment)</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{parseResult.filtered_status}</p>
                <p className="text-sm text-muted-foreground">Filtrados por status</p>
              </div>
            </div>

            {uniqueOrders === 0 ? (
              <Alert>
                <AlertTitle>Nenhum pedido novo encontrado</AlertTitle>
                <AlertDescription>
                  {parseResult.filtered_status} filtrados por status, {parseResult.filtered_envio} filtrados por metodo de envio. Verifique se o arquivo esta correto.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={onReset}
                  disabled={isConfirming}
                >
                  Voltar ao upload
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isConfirming}
                  className="w-full sm:w-auto"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Importando...
                    </>
                  ) : (
                    'Confirmar Importacao'
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Estado success (pos-confirmacao) */}
        {isSuccess && summary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{summary.total_validos}</p>
                <p className="text-sm text-muted-foreground">Pedidos importados</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{summary.duplicados}</p>
                <p className="text-sm text-muted-foreground">Ja importados</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{summary.filtered_status + summary.filtered_envio}</p>
                <p className="text-sm text-muted-foreground">Filtrados</p>
              </div>
            </div>

            {/* Breakdown por tipo */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Por tipo</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.por_tipo).map(([tipo, count]) => (
                  <Badge key={tipo} variant="outline">
                    {count} {TIPO_LABELS[tipo] ?? tipo}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Breakdown por grupo de envio */}
            {Object.keys(summary.por_grupo).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Por grupo de envio</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.por_grupo).map(([grupo, count]) => (
                    <Badge key={grupo} variant="secondary">
                      {count} {grupo}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Secao de estoque (D-14, D-15, D-16) */}
            {estoque && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">Estoque</p>
                {estoque.indisponivel ? (
                  <Alert>
                    <AlertTitle>Estoque indisponivel</AlertTitle>
                    <AlertDescription>
                      Reserva pendente. Use &quot;Atualizar Reservas&quot; na tela de fardos quando o estoque estiver disponivel.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-semibold">{estoque.skus_fardo}</p>
                        <p className="text-xs text-muted-foreground">SKUs com fardo</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-semibold">{estoque.skus_prateleira}</p>
                        <p className="text-xs text-muted-foreground">SKUs prateleira</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-xl font-semibold">{estoque.fardos_reservados}</p>
                        <p className="text-xs text-muted-foreground">Fardos reservados</p>
                      </div>
                    </div>
                    {estoque.parciais.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <span className="text-base">&#x26A0;</span>
                        <span>{estoque.parciais.length} SKU{estoque.parciais.length > 1 ? 's' : ''} com cobertura parcial</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
