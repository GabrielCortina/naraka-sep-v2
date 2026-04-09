'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Package,
  BookOpen,
  PackageCheck,
  Repeat,
  Users,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Upload,
  Package,
  BookOpen,
  PackageCheck,
  Repeat,
  Users,
}

interface NavItem {
  label: string
  href: string
  icon: string
  roles: string[]
}

export function BottomTabs({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const updateFades = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 2)
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    updateFades()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateFades, { passive: true })
    window.addEventListener('resize', updateFades)
    return () => {
      el.removeEventListener('scroll', updateFades)
      window.removeEventListener('resize', updateFades)
    }
  }, [updateFades, items])

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-background border-t md:hidden pb-[env(safe-area-inset-bottom)]">
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none transition-opacity duration-200"
        style={{
          background: 'linear-gradient(to right, hsl(var(--background)), transparent)',
          opacity: showLeft ? 1 : 0,
        }}
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none transition-opacity duration-200"
        style={{
          background: 'linear-gradient(to left, hsl(var(--background)), transparent)',
          opacity: showRight ? 1 : 0,
        }}
      />
      <div
        ref={scrollRef}
        className="flex h-full overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-h-[44px] px-4 shrink-0 transition-colors ${
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {Icon && <Icon className="h-6 w-6" />}
              <span className="text-xs font-semibold whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
