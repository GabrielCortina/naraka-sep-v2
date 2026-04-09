'use client'

import type { DashboardData } from '../types'
import { DashboardBlock } from './dashboard-block'
import { StatCard } from './stat-card'

interface ResumoGeralProps {
  resumo: DashboardData['resumo']
}

export function ResumoGeral({ resumo }: ResumoGeralProps) {
  return (
    <DashboardBlock title="RESUMO GERAL" defaultOpen>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <StatCard value={resumo.pecas_separadas} label="Pecas Separadas" />
        <StatCard value={resumo.listas_pendentes} label="Pendentes" />
        <StatCard value={resumo.listas_concluidas} label="Concluidas" />
        <StatCard
          value={resumo.listas_em_atraso}
          label="Em Atraso"
          variant="destructive"
        />
      </div>
    </DashboardBlock>
  )
}
