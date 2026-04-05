import { NextRequest } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { executeReservation } from '@/features/fardos/utils/reservation-engine'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 1. Auth guard (mesmo padrao do upload route -- T-04-07)
  const authSupabase = await createAuthClient()
  const { data: { user }, error: authError } = await authSupabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: userData } = await authSupabase
    .from('users').select('role').eq('id', user.id).single()
  if (!userData || !['admin', 'lider'].includes(userData.role)) {
    return Response.json({ error: 'Sem permissao' }, { status: 403 })
  }

  // 2. Buscar ultimo importacao_numero do config
  const { data: numConfig } = await supabaseAdmin
    .from('config').select('valor').eq('chave', 'ultimo_importacao_numero').single()

  if (!numConfig || Number(numConfig.valor) === 0) {
    return Response.json({ error: 'Nenhuma importacao ativa' }, { status: 400 })
  }

  const importacao_numero = Number(numConfig.valor)

  // 3. Executar re-reserva com forceRefresh=true (invalida cache -- D-02, D-05)
  try {
    const result = await executeReservation(importacao_numero, true)
    return Response.json({ success: true, ...result })
  } catch (error) {
    console.error('[reservas] Erro na re-reserva:', error)
    return Response.json(
      { error: 'Erro ao atualizar reservas' },
      { status: 500 }
    )
  }
}
