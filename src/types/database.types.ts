// Este arquivo sera substituido pelo output de:
// npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.types.ts
// Por enquanto, tipo minimo para compilacao

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nome: string
          pin_hash: string
          role: 'admin' | 'lider' | 'separador' | 'fardista'
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          pin_hash: string
          role: 'admin' | 'lider' | 'separador' | 'fardista'
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          pin_hash?: string
          role?: 'admin' | 'lider' | 'separador' | 'fardista'
          ativo?: boolean
          created_at?: string
        }
      }
      config: {
        Row: {
          id: string
          chave: string
          valor: string
          updated_at: string
        }
        Insert: {
          id?: string
          chave: string
          valor: string
          updated_at?: string
        }
        Update: {
          id?: string
          chave?: string
          valor?: string
          updated_at?: string
        }
      }
      pedidos: {
        Row: {
          id: string
          numero_pedido: string
          numero_pedido_plataforma: string | null
          plataforma: string
          loja: string
          sku: string
          quantidade: number
          variacao: string | null
          nome_produto: string | null
          metodo_envio: string
          grupo_envio: string
          tipo: 'unitario' | 'kit' | 'combo'
          importacao_numero: number
          importacao_data: string
          card_key: string
          prazo_envio: string | null
          created_at: string
        }
        Insert: {
          id?: string
          numero_pedido: string
          numero_pedido_plataforma?: string | null
          plataforma: string
          loja: string
          sku: string
          quantidade: number
          variacao?: string | null
          nome_produto?: string | null
          metodo_envio: string
          grupo_envio: string
          tipo: 'unitario' | 'kit' | 'combo'
          importacao_numero: number
          importacao_data?: string
          card_key: string
          prazo_envio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          numero_pedido?: string
          numero_pedido_plataforma?: string | null
          plataforma?: string
          loja?: string
          sku?: string
          quantidade?: number
          variacao?: string | null
          nome_produto?: string | null
          metodo_envio?: string
          grupo_envio?: string
          tipo?: 'unitario' | 'kit' | 'combo'
          importacao_numero?: number
          importacao_data?: string
          card_key?: string
          prazo_envio?: string | null
          created_at?: string
        }
      }
      progresso: {
        Row: {
          id: string
          pedido_id: string
          quantidade_separada: number
          status: 'pendente' | 'parcial' | 'completo' | 'nao_encontrado' | 'aguardar_fardista' | 'transformacao'
          updated_at: string
        }
        Insert: {
          id?: string
          pedido_id: string
          quantidade_separada?: number
          status?: 'pendente' | 'parcial' | 'completo' | 'nao_encontrado' | 'aguardar_fardista' | 'transformacao'
          updated_at?: string
        }
        Update: {
          id?: string
          pedido_id?: string
          quantidade_separada?: number
          status?: 'pendente' | 'parcial' | 'completo' | 'nao_encontrado' | 'aguardar_fardista' | 'transformacao'
          updated_at?: string
        }
      }
      reservas: {
        Row: {
          id: string
          pedido_id: string
          codigo_in: string
          sku: string
          quantidade: number
          endereco: string | null
          status: 'reservado' | 'cancelado'
          created_at: string
        }
        Insert: {
          id?: string
          pedido_id: string
          codigo_in: string
          sku: string
          quantidade: number
          endereco?: string | null
          status?: 'reservado' | 'cancelado'
          created_at?: string
        }
        Update: {
          id?: string
          pedido_id?: string
          codigo_in?: string
          sku?: string
          quantidade?: number
          endereco?: string | null
          status?: 'reservado' | 'cancelado'
          created_at?: string
        }
      }
      atribuicoes: {
        Row: {
          id: string
          card_key: string
          user_id: string
          tipo: 'separador' | 'fardista'
          created_at: string
        }
        Insert: {
          id?: string
          card_key: string
          user_id: string
          tipo: 'separador' | 'fardista'
          created_at?: string
        }
        Update: {
          id?: string
          card_key?: string
          user_id?: string
          tipo?: 'separador' | 'fardista'
          created_at?: string
        }
      }
      trafego_fardos: {
        Row: {
          id: string
          reserva_id: string
          codigo_in: string
          sku: string
          quantidade: number
          endereco: string | null
          status: 'pendente' | 'encontrado' | 'nao_encontrado'
          fardista_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reserva_id: string
          codigo_in: string
          sku: string
          quantidade: number
          endereco?: string | null
          status?: 'pendente' | 'encontrado' | 'nao_encontrado'
          fardista_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reserva_id?: string
          codigo_in?: string
          sku?: string
          quantidade?: number
          endereco?: string | null
          status?: 'pendente' | 'encontrado' | 'nao_encontrado'
          fardista_id?: string | null
          created_at?: string
        }
      }
      baixados: {
        Row: {
          id: string
          trafego_id: string
          codigo_in: string
          baixado_por: string
          baixado_em: string
        }
        Insert: {
          id?: string
          trafego_id: string
          codigo_in: string
          baixado_por: string
          baixado_em?: string
        }
        Update: {
          id?: string
          trafego_id?: string
          codigo_in?: string
          baixado_por?: string
          baixado_em?: string
        }
      }
      fardos_nao_encontrados: {
        Row: {
          id: string
          trafego_id: string
          codigo_in: string
          reportado_por: string
          reportado_em: string
        }
        Insert: {
          id?: string
          trafego_id: string
          codigo_in: string
          reportado_por: string
          reportado_em?: string
        }
        Update: {
          id?: string
          trafego_id?: string
          codigo_in?: string
          reportado_por?: string
          reportado_em?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
