'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function MobileHeader() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-background border-b z-10 md:hidden flex items-center justify-between px-4">
      <span className="text-xl font-semibold">NARAKA</span>
      <button
        onClick={handleLogout}
        className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        aria-label="Sair"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </header>
  )
}
