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

/** Resumo de estoque retornado pelo upload (D-14, D-15, D-16) */
export interface EstoqueSummary {
  skus_fardo: number
  skus_prateleira: number
  fardos_reservados: number
  parciais: string[]
  indisponivel: boolean
}
