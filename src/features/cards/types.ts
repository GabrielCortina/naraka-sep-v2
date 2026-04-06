export type UrgencyTier = 'overdue' | 'warning' | 'ok' | 'done'

export type MarketplaceKey =
  | 'Shopee SPX'
  | 'ML Flex'
  | 'ML Coleta'
  | 'TikTok Shop'
  | 'Shein'
  | 'Shopee Xpress'

export interface CardItem {
  sku: string
  quantidade_necessaria: number
  quantidade_separada: number
  status: 'pendente' | 'separado' | 'parcial' | 'nao_encontrado' | 'aguardar_fardista' | 'transformacao'
  pedido_ids: string[]
  reservas: {
    codigo_in: string
    quantidade: number
    endereco: string | null
    status: string
  }[]
}

export interface CardData {
  card_key: string
  grupo_envio: string
  tipo: string
  importacao_numero: number
  items: CardItem[]
  total_pecas: number
  pecas_separadas: number
  atribuido_a: { id: string; nome: string } | null
  urgency: UrgencyTier
}
