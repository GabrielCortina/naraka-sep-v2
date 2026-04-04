// Tipos globais do NARAKA SEP v2
export type { Database } from './database.types'

// Roles do sistema
export type UserRole = 'admin' | 'lider' | 'separador' | 'fardista'

// Tipos de pedido
export type TipoPedido = 'unitario' | 'kit' | 'combo'

// Status de progresso
export type StatusProgresso = 'pendente' | 'parcial' | 'completo' | 'nao_encontrado' | 'aguardar_fardista' | 'transformacao'

// Status de fardo no trafego
export type StatusTrafego = 'pendente' | 'encontrado' | 'nao_encontrado'
