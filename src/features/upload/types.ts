import type { TipoPedido } from '@/types'

export interface ImportSummary {
  total_validos: number
  filtered_status: number
  filtered_envio: number
  duplicados: number
  por_tipo: Record<TipoPedido, number>
  por_grupo: Record<string, number>
}

export interface ImportRecord {
  importacao_numero: number
  horario: string
  total_pedidos: number
  por_tipo: Record<TipoPedido, number>
  por_grupo: Record<string, number>
}
