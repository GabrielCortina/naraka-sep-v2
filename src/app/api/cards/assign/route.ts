import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 1. Autenticacao
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  // 2. Verificar role: apenas lider/admin podem atribuir (T-05-10)
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!dbUser || !['admin', 'lider'].includes(dbUser.role)) {
    return NextResponse.json(
      { error: 'Apenas lider ou admin pode atribuir' },
      { status: 403 }
    )
  }

  // 3. Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const { card_key, user_id, tipo } = body as {
    card_key: unknown
    user_id: unknown
    tipo: unknown
  }

  // 4. Validacao
  if (!card_key || typeof card_key !== 'string') {
    return NextResponse.json({ error: 'card_key invalido' }, { status: 400 })
  }
  if (!user_id || typeof user_id !== 'string') {
    return NextResponse.json({ error: 'user_id invalido' }, { status: 400 })
  }
  // CRITICO: tipo DEVE ser 'separador' ou 'fardista' — CHECK constraint no schema (T-05-12)
  if (!['separador', 'fardista'].includes(tipo as string)) {
    return NextResponse.json(
      { error: 'tipo deve ser separador ou fardista' },
      { status: 400 }
    )
  }

  // 5. Verificar que o usuario alvo existe e tem o role correto (T-05-11)
  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('role, ativo')
    .eq('id', user_id)
    .single()

  if (!targetUser || !targetUser.ativo) {
    return NextResponse.json(
      { error: 'Usuario nao encontrado ou inativo' },
      { status: 404 }
    )
  }
  if (targetUser.role !== tipo) {
    return NextResponse.json(
      { error: `Usuario nao e ${tipo}` },
      { status: 400 }
    )
  }

  // 6. Upsert atribuicao (UNIQUE(card_key, tipo) existe no schema)
  const { error } = await supabaseAdmin
    .from('atribuicoes')
    .upsert(
      { card_key, user_id, tipo: tipo as string },
      { onConflict: 'card_key,tipo' }
    )

  if (error) {
    return NextResponse.json({ error: 'Erro ao atribuir' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
