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

  // 2. Role check: admin, lider, separador can confirm; fardista cannot
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!dbUser || !['admin', 'lider', 'separador'].includes(dbUser.role)) {
    return NextResponse.json(
      { error: 'Sem permissao para confirmar transformacao' },
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

  const { transformacao_id, quantidade } = body as {
    transformacao_id: unknown
    quantidade: unknown
  }

  // 4. Validate inputs
  if (!transformacao_id || typeof transformacao_id !== 'string') {
    return NextResponse.json({ error: 'transformacao_id invalido' }, { status: 400 })
  }
  if (typeof quantidade !== 'number' || quantidade < 0 || !Number.isInteger(quantidade)) {
    return NextResponse.json({ error: 'Quantidade invalida' }, { status: 400 })
  }

  // 5. Fetch transformacao row and validate strict quantity (D-06, T-07.1-05 Tampering)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: transformacao, error: fetchError } = await (supabaseAdmin as any)
    .from('transformacoes')
    .select('*')
    .eq('id', transformacao_id)
    .single()

  if (fetchError || !transformacao) {
    return NextResponse.json({ error: 'Transformacao nao encontrada' }, { status: 404 })
  }

  if (transformacao.status === 'concluido') {
    return NextResponse.json({ error: 'Transformacao ja concluida' }, { status: 400 })
  }

  // STRICT validation (D-06): quantity MUST match exactly
  if (quantidade !== transformacao.quantidade) {
    return NextResponse.json(
      { error: `Quantidade deve ser exatamente ${transformacao.quantidade}` },
      { status: 400 }
    )
  }

  // 6. Authorization: separador must be assigned to this card (T-07.1-06)
  if (dbUser.role === 'separador') {
    if (transformacao.separador_id !== user.id) {
      return NextResponse.json(
        { error: 'Transformacao nao atribuida a voce' },
        { status: 403 }
      )
    }
  }

  // 7. Update status to concluido
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabaseAdmin as any)
    .from('transformacoes')
    .update({ status: 'concluido', concluido_at: new Date().toISOString() })
    .eq('id', transformacao_id)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao confirmar transformacao' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
