import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import type { UserRole } from '@/types'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  const userRole = userData.role as UserRole
  const userName = userData.nome

  return (
    <AppShell userRole={userRole} userName={userName}>
      {children}
    </AppShell>
  )
}
