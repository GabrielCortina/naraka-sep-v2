/** Item de estoque lido da planilha Google Sheets */
export interface StockItem {
  codigo_in: string
  sku: string
  quantidade: number
  endereco: string
  posicao: string
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

/** Status do fardo na lista do fardista */
export type FardoStatus = 'pendente' | 'encontrado' | 'nao_encontrado'

/** Item da lista plana de fardos (D-01, D-03) */
export interface FardoItem {
  reserva_id: string        // reservas.id
  codigo_in: string         // reservas.codigo_in (codigo IN do fardo)
  sku: string               // reservas.sku
  quantidade: number        // reservas.quantidade (pecas no fardo)
  endereco: string          // reservas.endereco
  status: FardoStatus       // 'pendente' default, 'encontrado' apos OK, 'nao_encontrado' apos N/E
  fardista_id: string | null     // atribuicoes.user_id (fardista atribuido)
  fardista_nome: string | null   // users.nome do fardista
  card_key: string | null        // card_key derivado dos pedidos que usam este SKU
  separador_nome: string | null  // nome do separador atribuido ao card (para PDF D-27)
  importacao_numero: number      // reservas.importacao_numero
  is_cascata: boolean            // flag para distinguir busca normal vs cascata no N/E (Phase 7)
}

/** Filtros da lista de fardos (D-06 a D-13) */
export interface FardoFilters {
  search: string                 // D-06: busca por codigo IN
  statusFilter: 'pendentes' | 'encontrados' | 'nao_encontrados' | 'baixados' | 'todos'  // D-07
  assignFilter: 'todos' | 'atribuidos' | 'nao_atribuidos'  // D-08
  sortBy: 'endereco' | 'sku' | 'importacao'  // D-11, D-13
}

/** Contadores da lista (D-09) */
export interface FardoCounters {
  pendentes: number
  encontrados: number
  nao_encontrados: number
  baixados: number
}

/** Item baixado para exibicao na lista de fardos (filtro Baixados) */
export interface BaixadoFardoItem {
  codigo_in: string
  sku: string
  quantidade: number
  endereco: string | null
  fardista_nome: string | null
  baixado_em: string
}
