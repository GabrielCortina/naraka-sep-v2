import type { UserRole } from '@/types'
import { NAV_ITEMS } from '@/features/auth/lib/role-config'
import { Sidebar } from './sidebar'
import { MobileHeader } from './mobile-header'
import { BottomTabs } from './bottom-tabs'

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

  return (
    <div className="min-h-screen">
      <Sidebar items={filteredItems} userName={userName} />
      <MobileHeader />
      <main className="md:ml-60 pt-12 md:pt-0 pb-14 md:pb-0 p-4 md:p-6">
        {children}
      </main>
      <BottomTabs items={filteredItems} />
    </div>
  )
}
