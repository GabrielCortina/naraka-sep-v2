'use client'

import { Separator } from '@/components/ui/separator'
import { ImportListItem } from '@/features/upload/components/import-list-item'
import type { ImportRecord } from '@/features/upload/types'

interface ImportListProps {
  imports: ImportRecord[]
  onUndo: () => void
  isProcessing: boolean
}

export function ImportList({ imports, onUndo, isProcessing }: ImportListProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Separator />
      <h2 className="text-xl font-semibold">Importacoes de hoje</h2>

      {imports.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma importacao realizada hoje
        </p>
      ) : (
        <div className="space-y-2">
          {imports.map((record, index) => (
            <ImportListItem
              key={record.importacao_numero}
              record={record}
              isLatest={index === 0}
              onUndo={onUndo}
              isProcessing={isProcessing}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
