import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TransformacaoClient } from './transformacao-client'

export const metadata: Metadata = {
  title: 'Transformacao | NARAKA SEP v2',
}

export default async function TransformacaoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, nome')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/login')
  }

  return (
    <TransformacaoClient
      userId={user.id}
      userRole={userData.role}
      userName={userData.nome}
    />
  )
}
