import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { nomeToEmail } from '@/features/auth/lib/slugify'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Autenticacao
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  // 2. Verificar role: apenas admin (T-10-01)
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!dbUser || dbUser.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  // 3. Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const { nome, pin, role, ativo } = body as {
    nome?: unknown
    pin?: unknown
    role?: unknown
    ativo?: unknown
  }

  // 4. At least one field required
  if (nome === undefined && pin === undefined && role === undefined && ativo === undefined) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const { id } = await params

  // 5. Toggle ativo (D-09)
  if (ativo !== undefined) {
    if (typeof ativo !== 'boolean') {
      return NextResponse.json({ error: 'ativo deve ser boolean' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ ativo })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, ativo })
  }

  // 6. Server-side validation for edit fields (T-10-06)
  if (nome !== undefined && (typeof nome !== 'string' || nome.trim().length === 0)) {
    return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 })
  }
  if (pin !== undefined && (typeof pin !== 'string' || !/^\d{4,6}$/.test(pin))) {
    return NextResponse.json({ error: 'PIN deve ter 4-6 digitos numericos' }, { status: 400 })
  }
  const validRoles = ['admin', 'lider', 'separador', 'fardista']
  if (role !== undefined && (typeof role !== 'string' || !validRoles.includes(role))) {
    return NextResponse.json({ error: 'Funcao invalida' }, { status: 400 })
  }

  // 7. Fetch current user for comparison (D-08)
  const { data: currentUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('nome')
    .eq('id', id)
    .single()

  if (fetchError || !currentUser) {
    return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
  }

  // 8. Build Auth updates
  const authUpdates: Record<string, unknown> = {}
  if (nome && typeof nome === 'string' && nome.trim() !== currentUser.nome) {
    authUpdates.email = nomeToEmail(nome.trim())
    authUpdates.user_metadata = { nome: nome.trim() }
  }
  if (pin && typeof pin === 'string') {
    authUpdates.password = pin
  }

  if (Object.keys(authUpdates).length > 0) {
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      authUpdates
    )
    if (authUpdateError) {
      if (
        authUpdateError.message.includes('already been registered') ||
        authUpdateError.message.includes('user_already_exists')
      ) {
        return NextResponse.json(
          { error: 'Ja existe um usuario com nome similar' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Erro ao atualizar autenticacao' }, { status: 500 })
    }
  }

  // 9. Build DB updates
  const dbUpdates: Record<string, unknown> = {}
  if (nome && typeof nome === 'string') dbUpdates.nome = nome.trim()
  if (role && typeof role === 'string') dbUpdates.role = role

  if (Object.keys(dbUpdates).length > 0) {
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update(dbUpdates)
      .eq('id', id)

    if (dbError) {
      return NextResponse.json({ error: 'Erro ao atualizar usuario' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
