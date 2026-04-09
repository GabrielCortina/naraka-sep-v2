import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UsuariosClient } from './usuarios-client'

export const metadata: Metadata = {
  title: 'Usuarios | NARAKA SEP v2',
}

export default async function UsuariosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    redirect('/dashboard')
  }

  return <UsuariosClient />
}
