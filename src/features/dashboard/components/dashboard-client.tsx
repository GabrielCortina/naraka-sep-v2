'use client'

import { useDashboardData } from '../hooks/use-dashboard-data'
import { usePeriodFilter } from '../hooks/use-period-filter'
import { ResumoGeral } from './resumo-geral'
import { ProgressaoMetodo } from './progressao-metodo'
import { TopSeparadores } from './top-separadores'
import { TopFardistas } from './top-fardistas'
import { StatusFardos } from './status-fardos'
import { PorSeparador } from './por-separador'

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`bg-muted animate-pulse rounded-lg ${className ?? ''}`} />
  )
}

export function DashboardClient() {
  const periodFilter = usePeriodFilter()
  const { data, loading, error } = useDashboardData({
    isHistorical: periodFilter.isHistorical,
    dateRange: periodFilter.dateRange,
  })

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-24" />
            </div>
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-48" />
          </div>
          <div className="flex flex-col gap-6">
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-2">
        <p className="text-lg font-semibold">Nenhum dado disponivel</p>
        <p className="text-sm text-muted-foreground">
          Importe uma planilha para iniciar a operacao do dia.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
        <div className="flex flex-col gap-6">
          <ResumoGeral resumo={data.resumo} />
          <ProgressaoMetodo progressao={data.progressao} />
          <PorSeparador entries={data.porSeparador} />
        </div>
        <div className="flex flex-col gap-6">
          <TopSeparadores
            entries={data.topSeparadores}
            periodFilter={periodFilter}
          />
          <TopFardistas entries={data.topFardistas} />
          <StatusFardos statusFardos={data.statusFardos} />
        </div>
      </div>
    </div>
  )
}
