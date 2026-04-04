import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Baixa | NARAKA SEP v2',
}

export default function BaixaPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
      <h1 className="text-xl font-semibold">Baixa de Fardos</h1>
      <p className="text-base text-muted-foreground">
        Baixa de Fardos sera implementada na Fase 8.
      </p>
    </div>
  )
}
