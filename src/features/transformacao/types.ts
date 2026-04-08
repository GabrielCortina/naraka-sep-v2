export type InstrucaoLider =
  | 'TRANSFORMACAO_LIBERADA'
  | 'SKU_VAI_CHEGAR'
  | 'PEGAR_NA_VALERIA'
  | 'PEGAR_NA_LOJA'

export interface TransformacaoItem {
  id: string
  sku: string
  quantidade: number
  card_key: string
  numero_pedido: string | null
  separador_id: string | null
  separador_nome: string | null
  status: 'pendente' | 'atribuido' | 'concluido'
  numero_transformacao: number
  created_at: string
  concluido_at: string | null
  instrucao_lider: InstrucaoLider | null
}

export interface TransformacaoCardData {
  card_key: string
  numero_transformacao: number
  grupo_envio: string
  tipo: string
  importacao_numero: number
  items: TransformacaoItem[]
  total_pecas: number
  pecas_concluidas: number
  atribuido_a: { id: string; nome: string } | null
  status: 'pendente' | 'atribuido' | 'concluido'
}
