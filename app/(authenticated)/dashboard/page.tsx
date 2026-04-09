import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/features/dashboard/components/dashboard-client'
import type { UserRole } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard | NARAKA SEP v2',
}

export default async function DashboardPage() {
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

  const userRole = (userData?.role ?? 'separador') as UserRole

  return <DashboardClient userRole={userRole} userId={user.id} />
}
