import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const VALID_INSTRUCOES = [
  'TRANSFORMACAO_LIBERADA',
  'SKU_VAI_CHEGAR',
  'PEGAR_NA_VALERIA',
  'PEGAR_NA_LOJA',
] as const

export async function PATCH(request: NextRequest) {
  // 1. Autenticacao
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  // 2. Role check: ONLY admin and lider (per D-08)
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!dbUser || !['admin', 'lider'].includes(dbUser.role)) {
    return NextResponse.json(
      { error: 'Sem permissao para definir instrucao' },
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

  const { transformacao_id, instrucao } = body as {
    transformacao_id: unknown
    instrucao: unknown
  }

  // 4. Validate transformacao_id
  if (!transformacao_id || typeof transformacao_id !== 'string') {
    return NextResponse.json({ error: 'transformacao_id invalido' }, { status: 400 })
  }

  // 5. Validate instrucao — must be one of 4 valid values OR null (to clear)
  if (instrucao !== null && (typeof instrucao !== 'string' || !VALID_INSTRUCOES.includes(instrucao as typeof VALID_INSTRUCOES[number]))) {
    return NextResponse.json({ error: 'Instrucao invalida' }, { status: 400 })
  }

  // 6. Verify transformacao exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: transformacao, error: fetchError } = await (supabaseAdmin as any)
    .from('transformacoes')
    .select('id')
    .eq('id', transformacao_id)
    .single()

  if (fetchError || !transformacao) {
    return NextResponse.json({ error: 'Transformacao nao encontrada' }, { status: 404 })
  }

  // 7. Update instrucao_lider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabaseAdmin as any)
    .from('transformacoes')
    .update({ instrucao_lider: instrucao })
    .eq('id', transformacao_id)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar instrucao' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
