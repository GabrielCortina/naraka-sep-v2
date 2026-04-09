import type { Metadata } from 'next'
import { DashboardClient } from '@/features/dashboard/components/dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard | NARAKA SEP v2',
}

export default function DashboardPage() {
  return <DashboardClient />
}
