'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Package,
  BookOpen,
  PackageCheck,
  Repeat,
  LogOut,
  Menu,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'naraka-sidebar-pinned'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Upload,
  Package,
  BookOpen,
  PackageCheck,
  Repeat,
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
  onWidthChange,
}: {
  items: NavItem[]
  userName: string
  onWidthChange?: (width: number) => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  // pinned = user clicked hamburger to keep it open
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [mounted, setMounted] = useState(false)

  const expanded = pinned || hovered

  // Load saved preference from localStorage
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') setPinned(true)
  }, [])

  // Notify parent of width changes
  useEffect(() => {
    if (!mounted) return
    onWidthChange?.(expanded ? 240 : 60)
  }, [expanded, mounted, onWidthChange])

  function togglePinned() {
    const next = !pinned
    setPinned(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`hidden md:flex md:flex-col h-screen fixed left-0 top-0 bg-background border-r z-30 transition-[width] duration-200 ease-in-out overflow-hidden ${
        expanded ? 'w-60' : 'w-[60px]'
      }`}
    >
      {/* Header: branding + hamburger */}
      <div className="flex items-center h-14 px-3 gap-2 shrink-0">
        <button
          onClick={togglePinned}
          className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0"
          aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
        >
          <Menu className="h-5 w-5" />
        </button>
        <span
          className={`text-xl font-semibold whitespace-nowrap transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          NARAKA
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pt-2">
        {items.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!expanded ? item.label : undefined}
              className={`flex items-center gap-2 h-11 px-3 rounded-md transition-colors mb-0.5 ${
                isActive
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <span
                className={`text-sm whitespace-nowrap transition-opacity duration-200 ${
                  expanded ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer: user + logout */}
      <div className="border-t px-2 py-2 shrink-0">
        <p
          className={`px-3 mb-1 text-xs text-muted-foreground truncate transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'opacity-0 h-0 mb-0'
          }`}
        >
          {userName}
        </p>
        <button
          onClick={handleLogout}
          title={!expanded ? 'Sair' : undefined}
          className="flex items-center gap-2 h-10 px-3 w-full rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span
            className={`text-sm whitespace-nowrap transition-opacity duration-200 ${
              expanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Sair
          </span>
        </button>
      </div>
    </aside>
  )
}
