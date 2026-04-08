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

  // 2. Role check: only lider/admin can assign (D-05, T-07.1-07)
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

  const { card_key, numero_transformacao, user_id } = body as {
    card_key: unknown
    numero_transformacao: unknown
    user_id: unknown
  }

  // 4. Validate
  if (!card_key || typeof card_key !== 'string') {
    return NextResponse.json({ error: 'card_key invalido' }, { status: 400 })
  }
  if (typeof numero_transformacao !== 'number' || !Number.isInteger(numero_transformacao)) {
    return NextResponse.json({ error: 'numero_transformacao invalido' }, { status: 400 })
  }
  if (!user_id || typeof user_id !== 'string') {
    return NextResponse.json({ error: 'user_id invalido' }, { status: 400 })
  }

  // 5. Verify target user exists and is separador (T-07.1-08)
  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('id, nome, role')
    .eq('id', user_id)
    .single()

  if (!targetUser || targetUser.role !== 'separador') {
    return NextResponse.json(
      { error: 'Usuario invalido ou nao e separador' },
      { status: 400 }
    )
  }

  // 6. Update ALL transformacoes matching card_key + numero_transformacao (D-09 allows reassignment)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabaseAdmin as any)
    .from('transformacoes')
    .update({
      separador_id: user_id,
      separador_nome: targetUser.nome,
      status: 'atribuido',
    })
    .eq('card_key', card_key)
    .eq('numero_transformacao', numero_transformacao)
    .neq('status', 'concluido') // Don't update already-completed items

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atribuir transformacao' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
