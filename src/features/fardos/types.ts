/** Item de estoque lido da planilha Google Sheets */
export interface StockItem {
  codigo_in: string
  sku: string
  quantidade: number
  endereco: string
}

/** Resultado do algoritmo subset sum para um SKU */
export interface SubsetResult {
  fardos: StockItem[]
  soma: number
  cobertura: 'total' | 'parcial' | 'nenhuma'
}

/** Resultado agregado da reserva para todos os SKUs de uma importacao */
export interface ReservationResult {
  skus_fardo: number
  skus_prateleira: number
  fardos_reservados: number
  parciais: string[]   // SKUs com cobertura parcial (D-15)
  indisponivel: boolean // true se Google Sheets falhou (D-16)
}

/** Resumo de estoque para exibicao no card de importacao (D-14) */
export interface StockSummary {
  skus_fardo: number
  skus_prateleira: number
  fardos_reservados: number
  parciais: string[]
  indisponivel: boolean
}
