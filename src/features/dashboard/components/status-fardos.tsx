'use client'

import type { DashboardData } from '../types'
import { DashboardBlock } from './dashboard-block'

interface StatusFardosProps {
  statusFardos: DashboardData['statusFardos']
}

export function StatusFardos({ statusFardos }: StatusFardosProps) {
  return (
    <DashboardBlock title="STATUS DE FARDOS">
      <div className="flex flex-col gap-2">
        <div className="border-l-4 border-yellow-500 bg-yellow-500/5 py-2 px-4 rounded-r">
          <p className="text-xs font-semibold uppercase">PENDENTES</p>
          <p className="text-xl font-semibold">{statusFardos.pendentes}</p>
        </div>
        <div className="border-l-4 border-blue-500 bg-blue-500/5 py-2 px-4 rounded-r">
          <p className="text-xs font-semibold uppercase">ENCONTRADOS</p>
          <p className="text-xl font-semibold">{statusFardos.encontrados}</p>
        </div>
        <div className="border-l-4 border-green-600 bg-green-600/5 py-2 px-4 rounded-r">
          <p className="text-xs font-semibold uppercase">BAIXADOS</p>
          <p className="text-xl font-semibold">{statusFardos.baixados}</p>
        </div>
      </div>
    </DashboardBlock>
  )
}
