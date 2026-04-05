'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Package,
  BookOpen,
  PackageCheck,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Upload,
  Package,
  BookOpen,
  PackageCheck,
}

interface NavItem {
  label: string
  href: string
  icon: string
  roles: string[]
}

export function Sidebar({
  items,
  userName,
}: {
  items: NavItem[]
  userName: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex md:flex-col w-60 h-screen fixed left-0 top-0 bg-background border-r">
      <div className="p-6">
        <span className="text-xl font-semibold">NARAKA</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-4">
        {items.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 h-12 px-3 rounded-md transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              {Icon && <Icon className="h-6 w-6" />}
              <span className="text-base">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <p className="px-3 mb-2 text-sm text-muted-foreground truncate">
          {userName}
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 h-12 px-3 w-full rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-6 w-6" />
          <span className="text-base">Sair</span>
        </button>
      </div>
    </aside>
  )
}
