'use client'

import { useState, useEffect } from 'react'
import type { UserRole } from '@/types'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { usePeriodFilter } from '../hooks/use-period-filter'
import { DashboardHeader } from './dashboard-header'
import { KpiHero } from './kpi-hero'
import { ResumoGeral } from './resumo-geral'
import { StatusFardos } from './status-fardos'
import { TopSeparadores } from './top-separadores'
import { TopFardistas } from './top-fardistas'
import { ProgressaoMetodo } from './progressao-metodo'
import { PorSeparador } from './por-separador'
import { MelhorDoDia } from './melhor-do-dia'
import { PerformanceTabela } from './performance-tabela'
import { TransformacoesResumo } from './transformacoes-resumo'
import { AlertasCorte } from './alertas-corte'
import { PedidosAtrasados } from './pedidos-atrasados'
import { VolumePorHora } from './volume-por-hora'
import { ComparativoLojas } from './comparativo-lojas'

interface DashboardClientProps {
  userRole: UserRole
  userId: string
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`bg-muted animate-pulse rounded-lg ${className ?? ''}`} />
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export function DashboardClient({ userRole, userId }: DashboardClientProps) {
  const periodFilter = usePeriodFilter()
  const { data, loading, error } = useDashboardData({
    isHistorical: periodFilter.isHistorical,
    dateRange: periodFilter.dateRange,
  })
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      setLastUpdated(formatTime(new Date()))
    }
  }, [data])

  const resumo = data ? { ...data.resumo, fardos_processados: data.statusFardos.ok } : null

  const isSeparador = userRole === 'separador'
  const isFardista = userRole === 'fardista'

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6">
        <SkeletonBlock className="h-12" />
        <SkeletonBlock className="h-24" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-5">
            <SkeletonBlock className="h-52" />
            <SkeletonBlock className="h-48" />
          </div>
          <div className="space-y-5">
            <SkeletonBlock className="h-64" />
            <SkeletonBlock className="h-48" />
          </div>
          <div className="space-y-5">
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (!data || !resumo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
        <p className="text-lg font-semibold">Nenhum dado disponivel</p>
        <p className="text-sm text-muted-foreground">
          Importe uma planilha para iniciar a operacao do dia.
        </p>
      </div>
    )
  }

  const myProgress = isSeparador
    ? data.porSeparador.filter(e => e.user_id === userId)
    : data.porSeparador

  const anonymizedTopSep = isSeparador
    ? data.topSeparadores.map(e => ({
        ...e,
        nome: e.user_id === userId ? e.nome : `Separador ${e.position}`,
      }))
    : data.topSeparadores

  if (isFardista) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6">
        <DashboardHeader
          period={periodFilter.period}
          onPeriodChange={periodFilter.setPeriod}
          customStart={periodFilter.customStart}
          customEnd={periodFilter.customEnd}
          onCustomStartChange={periodFilter.setCustomStart}
          onCustomEndChange={periodFilter.setCustomEnd}
          lastUpdated={lastUpdated}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-5">
            <SectionTitle>Status de fardos</SectionTitle>
            <StatusFardos statusFardos={data.statusFardos} />
          </div>
          <div className="space-y-5">
            <SectionTitle>Top fardistas</SectionTitle>
            <TopFardistas entries={data.topFardistas} />
          </div>
        </div>
      </div>
    )
  }

  if (isSeparador) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6">
        <DashboardHeader
          period={periodFilter.period}
          onPeriodChange={periodFilter.setPeriod}
          customStart={periodFilter.customStart}
          customEnd={periodFilter.customEnd}
          onCustomStartChange={periodFilter.setCustomStart}
          onCustomEndChange={periodFilter.setCustomEnd}
          lastUpdated={lastUpdated}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-5">
            <SectionTitle>Meu progresso</SectionTitle>
            <PorSeparador entries={myProgress} />
          </div>
          <div className="space-y-5">
            <SectionTitle>Ranking separadores</SectionTitle>
            <TopSeparadores entries={anonymizedTopSep} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <DashboardHeader
        period={periodFilter.period}
        onPeriodChange={periodFilter.setPeriod}
        customStart={periodFilter.customStart}
        customEnd={periodFilter.customEnd}
        onCustomStartChange={periodFilter.setCustomStart}
        onCustomEndChange={periodFilter.setCustomEnd}
        lastUpdated={lastUpdated}
      />

      <KpiHero
        pecasSeparadas={resumo.pecas_separadas}
        comparacao={data.comparacao}
      />

      <AlertasCorte progressao={data.progressao} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1 */}
        <div className="space-y-5">
          <SectionTitle>Resumo geral do dia</SectionTitle>
          <ResumoGeral resumo={resumo} comparacao={data.comparacao} />
          <SectionTitle>Melhor do dia</SectionTitle>
          <MelhorDoDia
            topSeparadores={data.topSeparadores}
            topFardistas={data.topFardistas}
          />
          <SectionTitle>Status de fardos</SectionTitle>
          <StatusFardos statusFardos={data.statusFardos} />
          <SectionTitle>Transformacoes</SectionTitle>
          <TransformacoesResumo data={data.transformacoesResumo} />
          <SectionTitle>Comparativo por loja</SectionTitle>
          <ComparativoLojas data={data.comparativoLojas} />
        </div>

        {/* Column 2 */}
        <div className="space-y-5">
          <SectionTitle>Pedidos atrasados</SectionTitle>
          <PedidosAtrasados progressao={data.progressao} />
          <SectionTitle>Progresso por separador</SectionTitle>
          <PorSeparador entries={data.porSeparador} />
          <SectionTitle>Progresso por metodo</SectionTitle>
          <ProgressaoMetodo progressao={data.progressao} />
          <SectionTitle>Volume por hora</SectionTitle>
          <VolumePorHora data={data.volumePorHora} />
        </div>

        {/* Column 3 */}
        <div className="space-y-5">
          <SectionTitle>Top fardistas</SectionTitle>
          <TopFardistas entries={data.topFardistas} />
          <SectionTitle>Top separadores</SectionTitle>
          <TopSeparadores entries={data.topSeparadores} />
        </div>
      </div>

      <SectionTitle>Performance por separador e dia</SectionTitle>
      <PerformanceTabela data={data.performanceSemanal} />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
      {children}
    </h2>
  )
}
