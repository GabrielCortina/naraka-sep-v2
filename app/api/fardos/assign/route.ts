import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  // 2. Role check: apenas admin/lider (T-06-09, T-06-12)
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!dbUser || !['admin', 'lider'].includes(dbUser.role)) {
    return NextResponse.json(
      { error: 'Apenas lider ou admin pode atribuir' },
      { status: 403 },
    )
  }

  // 3. Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const { card_keys, user_id } = body as {
    card_keys: unknown
    user_id: unknown
  }

  // 4. Validate
  if (
    !Array.isArray(card_keys) ||
    card_keys.length === 0 ||
    !card_keys.every((k: unknown) => typeof k === 'string')
  ) {
    return NextResponse.json(
      { error: 'card_keys deve ser um array de strings' },
      { status: 400 },
    )
  }
  if (!user_id || typeof user_id !== 'string') {
    return NextResponse.json({ error: 'user_id invalido' }, { status: 400 })
  }

  // 5. Verify target user is an active fardista (T-06-09)
  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('role, ativo')
    .eq('id', user_id)
    .single()

  if (!targetUser || !targetUser.ativo) {
    return NextResponse.json(
      { error: 'Usuario nao encontrado ou inativo' },
      { status: 404 },
    )
  }
  if (targetUser.role !== 'fardista') {
    return NextResponse.json(
      { error: 'Usuario nao e fardista' },
      { status: 400 },
    )
  }

  // 6. Upsert atribuicoes for each card_key
  let count = 0
  for (const cardKey of card_keys as string[]) {
    const { error } = await supabaseAdmin.from('atribuicoes').upsert(
      { card_key: cardKey, user_id: user_id as string, tipo: 'fardista' },
      { onConflict: 'card_key,tipo' },
    )
    if (!error) count++
  }

  return NextResponse.json({ success: true, count })
}
