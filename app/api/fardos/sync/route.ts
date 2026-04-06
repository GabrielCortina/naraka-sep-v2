import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { executeReservation } from '@/features/fardos/utils/reservation-engine'

export async function POST() {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  // 2. Role check: apenas admin/lider (T-06-10)
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!dbUser || !['admin', 'lider'].includes(dbUser.role)) {
    return NextResponse.json(
      { error: 'Apenas lider ou admin pode sincronizar' },
      { status: 403 },
    )
  }

  // 3. Get latest importacao_numero
  const { data: latestPedido, error: pedidoError } = await supabaseAdmin
    .from('pedidos')
    .select('importacao_numero')
    .order('importacao_numero', { ascending: false })
    .limit(1)
    .single()

  if (pedidoError || !latestPedido) {
    return NextResponse.json(
      { error: 'Nenhuma importacao encontrada' },
      { status: 404 },
    )
  }

  // 4. Execute reservation with forceRefresh=true
  try {
    const result = await executeReservation(
      latestPedido.importacao_numero,
      true,
    )
    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Erro ao sincronizar estoque:', err)
    return NextResponse.json(
      { error: 'Erro ao sincronizar estoque' },
      { status: 500 },
    )
  }
}
