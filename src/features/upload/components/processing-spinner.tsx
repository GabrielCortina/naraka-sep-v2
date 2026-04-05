'use client'

import { Loader2 } from 'lucide-react'

interface ProcessingSpinnerProps {
  message?: string
  visible: boolean
}

export function ProcessingSpinner({
  message = 'Importando pedidos...',
  visible,
}: ProcessingSpinnerProps) {
  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-10 w-10 text-primary animate-spin"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-foreground">
          {message}
        </p>
      </div>
    </div>
  )
}
