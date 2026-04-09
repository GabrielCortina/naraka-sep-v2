import type { UrgencyTier } from '@/features/cards/types'

export interface DashboardData {
  resumo: {
    pecas_separadas: number
    listas_pendentes: number
    listas_concluidas: number
    listas_em_atraso: number
  }
  progressao: ProgressaoMetodo[]
  topSeparadores: RankingEntry[]
  topFardistas: RankingEntry[]
  statusFardos: {
    pendentes: number
    encontrados: number
    baixados: number
  }
  porSeparador: SeparadorProgress[]
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
}

export interface SeparadorProgress {
  user_id: string
  nome: string
  total_pecas: number
  pecas_separadas: number
  percent: number
  num_cards: number
}

export type PeriodFilter = 'hoje' | '15d' | '30d' | 'mes_atual' | 'ultimo_mes' | '3m' | 'personalizado'

export interface HistoricoDiarioRow {
  user_id: string
  role: string
  grupo_envio: string
  pecas_separadas: number
  cards_concluidos: number
  fardos_confirmados: number
  data: string
}
