import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 1. Autenticacao: getUser() para verificar usuario logado
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  // 2. Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const { pedido_id, quantidade_separada, status } = body as {
    pedido_id: unknown
    quantidade_separada: unknown
    status: unknown
  }

  // 3. Validacao (T-05-09 Tampering mitigation)
  if (!pedido_id || typeof pedido_id !== 'string') {
    return NextResponse.json({ error: 'pedido_id invalido' }, { status: 400 })
  }
  if (typeof quantidade_separada !== 'number' || quantidade_separada < 0) {
    return NextResponse.json({ error: 'Quantidade deve ser >= 0' }, { status: 400 })
  }
  const validStatus = ['pendente', 'parcial', 'completo', 'nao_encontrado']
  if (!validStatus.includes(status as string)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
  }

  // 4. Verificar que pedido existe e validar quantidade maxima
  const { data: pedido } = await supabaseAdmin
    .from('pedidos')
    .select('quantidade')
    .eq('id', pedido_id)
    .single()

  if (!pedido) {
    return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
  }
  if (quantidade_separada > pedido.quantidade) {
    return NextResponse.json({ error: 'Quantidade excede o necessario' }, { status: 400 })
  }

  // 5. Insert or update progresso (no UNIQUE on pedido_id, so select first)
  const { data: existing } = await supabaseAdmin
    .from('progresso')
    .select('id')
    .eq('pedido_id', pedido_id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabaseAdmin
      .from('progresso')
      .update({
        quantidade_separada,
        status: status as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar progresso' }, { status: 500 })
    }
  } else {
    const { error } = await supabaseAdmin
      .from('progresso')
      .insert({
        pedido_id,
        quantidade_separada,
        status: status as string,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: 'Erro ao salvar progresso' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
