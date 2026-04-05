import type { ParsedRow } from './parse-xlsx'
import type { TipoPedido } from '@/types'

export interface GroupedOrder {
  numero_pedido: string
  items: ParsedRow[]
  tipo: TipoPedido
}

export function classifyOrders(rows: ParsedRow[]): GroupedOrder[] {
  const groups = new Map<string, ParsedRow[]>()
  for (const row of rows) {
    const existing = groups.get(row.numero_pedido) ?? []
    existing.push(row)
    groups.set(row.numero_pedido, existing)
  }

  return Array.from(groups.entries()).map(([numero_pedido, items]) => {
    const uniqueSkus = new Set(items.map(i => i.sku))
    const totalQty = items.reduce((sum, i) => sum + i.quantidade, 0)

    let tipo: TipoPedido
    if (uniqueSkus.size >= 2) {
      tipo = 'combo'
    } else if (totalQty > 1) {
      tipo = 'kit'
    } else {
      tipo = 'unitario'
    }

    return { numero_pedido, items, tipo }
  })
}

export function generateCardKey(grupo_envio: string, tipo: TipoPedido, importacao_numero: number): string {
  return `${grupo_envio}|${tipo}|${importacao_numero}`
}
