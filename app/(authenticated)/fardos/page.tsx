import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FardosClient } from './fardos-client'

export const metadata: Metadata = {
  title: 'Fardos | NARAKA SEP v2',
}

export default async function FardosPage() {
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
    <FardosClient
      userId={user.id}
      userRole={userData.role}
      userName={userData.nome}
    />
  )
}
