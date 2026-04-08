'use client'

import { useState, useCallback, useEffect } from 'react'
import type { UserRole } from '@/types'
import { NAV_ITEMS } from '@/features/auth/lib/role-config'
import { Sidebar } from './sidebar'
import { MobileHeader } from './mobile-header'
import { BottomTabs } from './bottom-tabs'
import { LoadingOverlay } from './loading-overlay'

export function AppShell({
  children,
  userRole,
  userName,
}: {
  children: React.ReactNode
  userRole: UserRole
  userName: string
}) {
  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  )

  const [sidebarWidth, setSidebarWidth] = useState(60)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleWidthChange = useCallback((width: number) => {
    setSidebarWidth(width)
  }, [])

  return (
    <div className="min-h-screen">
      <Sidebar
        items={filteredItems}
        userName={userName}
        onWidthChange={handleWidthChange}
      />
      <MobileHeader />
      <main
        className="pt-12 pb-14 md:pt-0 md:pb-0 p-4 md:p-6 transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: isDesktop ? sidebarWidth : undefined }}
      >
        {children}
      </main>
      <BottomTabs items={filteredItems} />
      <LoadingOverlay />
    </div>
  )
}
