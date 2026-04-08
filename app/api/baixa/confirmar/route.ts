import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 1. Auth: createClient -> getUser -> role check
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role, nome')
    .eq('id', user.id)
    .single()

  if (!userData || !['fardista', 'admin', 'lider'].includes(userData.role)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  // 2. Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const { codigo_in, trafego_id } = body as {
    codigo_in: unknown
    trafego_id: unknown
  }

  if (!codigo_in || typeof codigo_in !== 'string') {
    return NextResponse.json({ error: 'codigo_in obrigatorio' }, { status: 400 })
  }
  if (!trafego_id || typeof trafego_id !== 'string') {
    return NextResponse.json({ error: 'trafego_id obrigatorio' }, { status: 400 })
  }

  const trimmedCodigoIn = codigo_in.trim()

  // 3. Duplicate guard: check baixados
  const { data: existingBaixa } = await supabaseAdmin
    .from('baixados')
    .select('id')
    .eq('codigo_in', trimmedCodigoIn)
    .maybeSingle()

  if (existingBaixa) {
    return NextResponse.json({ error: 'Fardo ja teve baixa' }, { status: 409 })
  }

  // 4. Status guard: trafego must be 'encontrado'
  const { data: trafego } = await supabaseAdmin
    .from('trafego_fardos')
    .select('id, status')
    .eq('id', trafego_id)
    .single()

  if (!trafego || trafego.status !== 'encontrado') {
    return NextResponse.json({ error: 'Fardo ja foi processado' }, { status: 409 })
  }

  // 5. Execute 3-step baixa (D-19)
  try {
    // (a) Insert into baixados
    const { error: insertError } = await supabaseAdmin
      .from('baixados')
      .insert({
        codigo_in: trimmedCodigoIn,
        trafego_id: trafego_id,
        baixado_por: user.id,
      })

    if (insertError) {
      // Race condition: unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Fardo ja teve baixa' }, { status: 409 })
      }
      console.error('[baixa/confirmar] Erro ao inserir baixados:', insertError)
      return NextResponse.json({ error: 'Erro ao registrar baixa' }, { status: 500 })
    }

    // (b) Update trafego_fardos status to 'baixado'
    const { error: updateError } = await supabaseAdmin
      .from('trafego_fardos')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ status: 'baixado' as any })
      .eq('id', trafego_id)

    if (updateError) {
      console.error('[baixa/confirmar] Erro ao atualizar trafego:', updateError)
    }

    // (c) Unlock AGUARDAR FARDISTA lines (D-17, D-18)
    let unlockedCount = 0

    // Find reservas for this codigo_in
    const { data: reservas } = await supabaseAdmin
      .from('reservas')
      .select('sku, importacao_numero')
      .eq('codigo_in', trimmedCodigoIn)
      .eq('status', 'reservado')

    if (reservas && reservas.length > 0) {
      for (const reserva of reservas) {
        // Find pedidos by sku + importacao_numero
        let pedidosQuery = supabaseAdmin
          .from('pedidos')
          .select('id')
          .eq('sku', reserva.sku)

        if (reserva.importacao_numero != null) {
          pedidosQuery = pedidosQuery.eq('importacao_numero', reserva.importacao_numero)
        }

        const { data: pedidos } = await pedidosQuery

        if (pedidos && pedidos.length > 0) {
          const pedidoIds = pedidos.map(p => p.id)

          // Update progresso from aguardar_fardista to pendente
          const { data: updated } = await supabaseAdmin
            .from('progresso')
            .update({ status: 'pendente', updated_at: new Date().toISOString() })
            .in('pedido_id', pedidoIds)
            .eq('status', 'aguardar_fardista')
            .select('id')

          unlockedCount += updated?.length ?? 0
        }
      }
    }

    return NextResponse.json({ success: true, unlocked_count: unlockedCount })
  } catch (error) {
    console.error('[baixa/confirmar] Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
