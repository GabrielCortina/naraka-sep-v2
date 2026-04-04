import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fardos | NARAKA SEP v2',
}

export default function FardosPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
      <h1 className="text-xl font-semibold">Fardos</h1>
      <p className="text-base text-muted-foreground">
        Lista de Fardos sera implementada na Fase 6.
      </p>
    </div>
  )
}
