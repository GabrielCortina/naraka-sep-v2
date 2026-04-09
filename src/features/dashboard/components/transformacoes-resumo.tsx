'use client'

import type { TransformacoesResumo as TransformacoesResumoType } from '../types'

interface TransformacoesResumoProps {
  data: TransformacoesResumoType
}

export function TransformacoesResumo({ data }: TransformacoesResumoProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-card border rounded-lg p-4 flex flex-col justify-between min-h-[100px]">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">
          Pedidos em transformacao
        </p>
        <p className="text-[28px] font-normal tabular-nums leading-none mt-2 text-[#7F77DD]">
          {data.total_pedidos.toLocaleString('pt-BR')}
        </p>
      </div>
      <div className="bg-card border rounded-lg p-4 flex flex-col justify-between min-h-[100px]">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">
          Pecas em transformacao
        </p>
        <p className="text-[28px] font-normal tabular-nums leading-none mt-2 text-[#7F77DD]">
          {data.total_pecas.toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  )
}
