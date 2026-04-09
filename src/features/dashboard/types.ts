import type { UrgencyTier } from '@/features/cards/types'

export interface DashboardData {
  resumo: ResumoData
  progressao: ProgressaoMetodo[]
  topSeparadores: RankingEntry[]
  topFardistas: RankingEntry[]
  statusFardos: StatusFardosData
  porSeparador: SeparadorProgress[]
  comparacao: ComparacaoData | null
  performanceSemanal: PerformanceSemanal[]
  transformacoesResumo: TransformacoesResumo
  volumePorHora: VolumePorHora[]
  comparativoLojas: ComparativoLoja[]
}

export interface ComparativoLoja {
  loja: string
  total_pedidos: number
  total_pecas: number
}

export interface VolumePorHora {
  hora: number // 0-23
  pecas: number
}

export interface ResumoData {
  total_pedidos: number
  pecas_separadas: number
  percent_conclusao: number
  fardos_processados: number
  listas_pendentes: number
  listas_concluidas: number
  listas_em_atraso: number
}

export interface ComparacaoData {
  pecas_separadas_ontem: number
  fardos_processados_ontem: number
  total_pedidos_ontem: number
  percent_conclusao_ontem: number
}

export interface StatusFardosData {
  ok: number
  nao_encontrado: number
  pendentes: number
  transformacao: number
  sem_atribuicao: number
  total: number
}

export interface ProgressaoMetodo {
  grupo_envio: string
  total_pecas: number
  pecas_separadas: number
  percent: number
  urgency: UrgencyTier
  deadline_ms: number
}

export interface RankingEntry {
  position: number
  user_id: string
  nome: string
  pecas_separadas: number
  cards_concluidos: number
  fardos_confirmados: number
  fardos_ne: number
}

export interface SeparadorProgress {
  user_id: string
  nome: string
  total_pecas: number
  pecas_separadas: number
  percent: number
  num_cards: number
}

export type PeriodFilter = 'hoje' | 'ontem' | '7d' | '30d' | 'personalizado'

export interface TransformacoesResumo {
  total_pedidos: number
  total_pecas: number
}

export interface PerformanceSemanal {
  separador_nome: string
  dias: Record<string, number> // 'YYYY-MM-DD' -> total_pecas
  media: number
  tendencia: 'up' | 'down' | 'stable'
}

export interface HistoricoDiarioRow {
  user_id: string
  role: string
  grupo_envio: string
  pecas_separadas: number
  cards_concluidos: number
  fardos_confirmados: number
  data: string
}
