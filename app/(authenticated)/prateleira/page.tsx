import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prateleira | NARAKA SEP v2',
}

export default function PrateleiraPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
      <h1 className="text-xl font-semibold">Prateleira</h1>
      <p className="text-base text-muted-foreground">
        Lista de Prateleira sera implementada na Fase 7.
      </p>
    </div>
  )
}
