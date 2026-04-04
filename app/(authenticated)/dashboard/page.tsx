import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | NARAKA SEP v2',
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-base text-muted-foreground">
        Dashboard sera implementado na Fase 9.
      </p>
    </div>
  )
}
