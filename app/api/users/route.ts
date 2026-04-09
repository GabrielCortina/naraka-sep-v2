import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { nomeToEmail } from '@/features/auth/lib/slugify'

export async function GET() {
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

  // 3. Buscar todos os usuarios (T-10-05: only safe fields)
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, nome, role, ativo, created_at')
    .order('nome', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuarios' }, { status: 500 })
  }

  return NextResponse.json({ users: data })
}

export async function POST(request: NextRequest) {
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

  const { nome, pin, role } = body as {
    nome: unknown
    pin: unknown
    role: unknown
  }

  // 4. Server-side validation (T-10-02)
  if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
    return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 })
  }
  if (!pin || typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN deve ter 4-6 digitos numericos' }, { status: 400 })
  }
  const validRoles = ['admin', 'lider', 'separador', 'fardista']
  if (!role || typeof role !== 'string' || !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Funcao invalida' }, { status: 400 })
  }

  // 5. Gerar email ficticio
  const email = nomeToEmail((nome as string).trim())

  // 6. Criar usuario no Auth
  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: pin as string,
    email_confirm: true,
    user_metadata: { nome: (nome as string).trim() },
  })

  if (createError) {
    if (
      createError.message.includes('already been registered') ||
      createError.message.includes('user_already_exists')
    ) {
      return NextResponse.json(
        { error: 'Ja existe um usuario com nome similar' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Erro ao criar usuario' }, { status: 500 })
  }

  // 7. Upsert public.users
  const { error: upsertError } = await supabaseAdmin.from('users').upsert(
    {
      id: authData.user.id,
      nome: (nome as string).trim(),
      pin_hash: 'supabase-auth-managed',
      role: role as string,
      ativo: true,
    },
    { onConflict: 'id' }
  )

  if (upsertError) {
    return NextResponse.json({ error: 'Erro ao salvar usuario' }, { status: 500 })
  }

  return NextResponse.json(
    {
      user: {
        id: authData.user.id,
        nome: (nome as string).trim(),
        role: role as string,
        ativo: true,
      },
    },
    { status: 201 }
  )
}
