export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atribuicoes: {
        Row: {
          card_key: string
          created_at: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          card_key: string
          created_at?: string
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          card_key?: string
          created_at?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atribuicoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      baixados: {
        Row: {
          baixado_em: string
          baixado_por: string
          codigo_in: string
          id: string
          trafego_id: string
        }
        Insert: {
          baixado_em?: string
          baixado_por: string
          codigo_in: string
          id?: string
          trafego_id: string
        }
        Update: {
          baixado_em?: string
          baixado_por?: string
          codigo_in?: string
          id?: string
          trafego_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "baixados_baixado_por_fkey"
            columns: ["baixado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baixados_trafego_id_fkey"
            columns: ["trafego_id"]
            isOneToOne: false
            referencedRelation: "trafego_fardos"
            referencedColumns: ["id"]
          },
        ]
      }
      config: {
        Row: {
          chave: string
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          chave?: string
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      fardos_nao_encontrados: {
        Row: {
          codigo_in: string
          id: string
          reportado_em: string
          reportado_por: string
          trafego_id: string
        }
        Insert: {
          codigo_in: string
          id?: string
          reportado_em?: string
          reportado_por: string
          trafego_id: string
        }
        Update: {
          codigo_in?: string
          id?: string
          reportado_em?: string
          reportado_por?: string
          trafego_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fardos_nao_encontrados_reportado_por_fkey"
            columns: ["reportado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fardos_nao_encontrados_trafego_id_fkey"
            columns: ["trafego_id"]
            isOneToOne: false
            referencedRelation: "trafego_fardos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          card_key: string
          created_at: string
          grupo_envio: string
          id: string
          importacao_data: string
          importacao_numero: number
          loja: string
          metodo_envio: string
          nome_produto: string | null
          numero_pedido: string
          numero_pedido_plataforma: string | null
          plataforma: string
          prazo_envio: string | null
          quantidade: number
          sku: string
          tipo: string
          variacao: string | null
        }
        Insert: {
          card_key: string
          created_at?: string
          grupo_envio: string
          id?: string
          importacao_data?: string
          importacao_numero: number
          loja: string
          metodo_envio: string
          nome_produto?: string | null
          numero_pedido: string
          numero_pedido_plataforma?: string | null
          plataforma: string
          prazo_envio?: string | null
          quantidade: number
          sku: string
          tipo: string
          variacao?: string | null
        }
        Update: {
          card_key?: string
          created_at?: string
          grupo_envio?: string
          id?: string
          importacao_data?: string
          importacao_numero?: number
          loja?: string
          metodo_envio?: string
          nome_produto?: string | null
          numero_pedido?: string
          numero_pedido_plataforma?: string | null
          plataforma?: string
          prazo_envio?: string | null
          quantidade?: number
          sku?: string
          tipo?: string
          variacao?: string | null
        }
        Relationships: []
      }
      progresso: {
        Row: {
          id: string
          pedido_id: string
          quantidade_separada: number
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          pedido_id: string
          quantidade_separada?: number
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pedido_id?: string
          quantidade_separada?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          codigo_in: string
          created_at: string
          endereco: string | null
          id: string
          importacao_numero: number | null
          quantidade: number
          sku: string
          status: string
        }
        Insert: {
          codigo_in: string
          created_at?: string
          endereco?: string | null
          id?: string
          importacao_numero?: number | null
          quantidade: number
          sku: string
          status?: string
        }
        Update: {
          codigo_in?: string
          created_at?: string
          endereco?: string | null
          id?: string
          importacao_numero?: number | null
          quantidade?: number
          sku?: string
          status?: string
        }
        Relationships: []
      }
      trafego_fardos: {
        Row: {
          codigo_in: string
          created_at: string
          endereco: string | null
          fardista_id: string | null
          id: string
          quantidade: number
          reserva_id: string
          sku: string
          status: string
        }
        Insert: {
          codigo_in: string
          created_at?: string
          endereco?: string | null
          fardista_id?: string | null
          id?: string
          quantidade: number
          reserva_id: string
          sku: string
          status?: string
        }
        Update: {
          codigo_in?: string
          created_at?: string
          endereco?: string | null
          fardista_id?: string | null
          id?: string
          quantidade?: number
          reserva_id?: string
          sku?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "trafego_fardos_fardista_id_fkey"
            columns: ["fardista_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trafego_fardos_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          pin_hash: string
          role: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          pin_hash: string
          role: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          pin_hash?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
