'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Package,
  BookOpen,
  PackageCheck,
} from 'lucide-react'

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

export function BottomTabs({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-background border-t md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-full">
        {items.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {Icon && <Icon className="h-6 w-6" />}
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
