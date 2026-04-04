/**
 * Seed script: cria usuarios de desenvolvimento no Supabase Auth + public.users.
 * IDs ficam sincronizados entre auth.users e public.users.
 *
 * Uso: npx tsx scripts/seed-auth-users.ts
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Construir client admin diretamente (sem path aliases que nao funcionam no tsx)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// Funcao de slug inline (copia de src/features/auth/lib/slugify.ts)
function nomeToEmail(nome: string): string {
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug}@naraka.local`
}

// Usuarios de desenvolvimento
const SEED_USERS = [
  { nome: 'Admin Teste', pin: '1234', role: 'admin' },
  { nome: 'Lider Teste', pin: '1234', role: 'lider' },
  { nome: 'Separador Teste', pin: '1234', role: 'separador' },
  { nome: 'Fardista Teste', pin: '1234', role: 'fardista' },
] as const

async function seedUsers() {
  console.log('Iniciando seed de usuarios de desenvolvimento...\n')

  for (const user of SEED_USERS) {
    const email = nomeToEmail(user.nome)
    console.log(`[${user.role}] ${user.nome} -> ${email}`)

    // 1. Criar usuario no Supabase Auth
    let authUserId: string

    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: user.pin,
      email_confirm: true,
      user_metadata: { nome: user.nome },
    })

    if (createError) {
      // Se usuario ja existe, buscar o ID existente
      if (
        createError.message?.includes('already been registered') ||
        createError.message?.includes('user_already_exists')
      ) {
        console.log(`  -> Usuario ja existe no Auth, buscando ID...`)

        const { data: listData, error: listError } = await supabase.auth.admin.listUsers()

        if (listError) {
          console.error(`  ERRO ao listar usuarios: ${listError.message}`)
          process.exit(1)
        }

        const existingUser = listData.users.find((u) => u.email === email)
        if (!existingUser) {
          console.error(`  ERRO: usuario com email ${email} nao encontrado apos erro de duplicata`)
          process.exit(1)
        }

        authUserId = existingUser.id
        console.log(`  -> ID existente: ${authUserId}`)
      } else {
        console.error(`  ERRO ao criar usuario no Auth: ${createError.message}`)
        process.exit(1)
      }
    } else {
      authUserId = createData.user.id
      console.log(`  -> Criado no Auth com ID: ${authUserId}`)
    }

    // 2. Upsert na tabela public.users (ID deve coincidir com auth.users)
    const { error: upsertError } = await supabase.from('users').upsert(
      {
        id: authUserId,
        nome: user.nome,
        pin_hash: 'supabase-auth-managed',
        role: user.role,
        ativo: true,
      },
      { onConflict: 'id' }
    )

    if (upsertError) {
      console.error(`  ERRO ao upsert em public.users: ${upsertError.message}`)
      process.exit(1)
    }

    console.log(`  -> Upsert em public.users OK\n`)
  }

  console.log('Seed concluido com sucesso! 4 usuarios criados/atualizados.')
  process.exit(0)
}

seedUsers().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
