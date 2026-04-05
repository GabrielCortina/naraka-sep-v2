'use client'

import { Button } from '@/components/ui/button'
import { Printer, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectionBarProps {
  selectedCount: number
  onAssign: () => void
  onPrint: () => void
}

export function SelectionBar({
  selectedCount,
  onAssign,
  onPrint,
}: SelectionBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-3 pb-6 flex items-center justify-between transition-transform duration-200',
        selectedCount > 0 ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <span className="text-sm font-medium">
        {selectedCount} fardos selecionados
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          onClick={onPrint}
        >
          <Printer className="h-4 w-4 mr-1" />
          Imprimir
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          onClick={onAssign}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Atribuir
        </Button>
      </div>
    </div>
  )
}
