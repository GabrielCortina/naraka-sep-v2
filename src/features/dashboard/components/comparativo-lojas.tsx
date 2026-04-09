'use client'

import type { ComparativoLoja } from '../types'

interface ComparativoLojasProps {
  data: ComparativoLoja[]
}

export function ComparativoLojas({ data }: ComparativoLojasProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">Nenhum dado de lojas</p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left text-muted-foreground font-medium px-3 py-2">
              Loja
            </th>
            <th className="text-right text-muted-foreground font-medium px-3 py-2">
              Pedidos
            </th>
            <th className="text-right text-muted-foreground font-medium px-3 py-2">
              Pecas
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.loja} className="border-b last:border-b-0">
              <td className="px-3 py-2 font-medium">
                {entry.loja}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {entry.total_pedidos.toLocaleString('pt-BR')}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {entry.total_pecas.toLocaleString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
