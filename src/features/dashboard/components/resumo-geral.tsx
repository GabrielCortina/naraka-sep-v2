'use client'

import type { ResumoData, ComparacaoData } from '../types'

interface ResumoGeralProps {
  resumo: ResumoData
  comparacao: ComparacaoData | null
}

function getPercentColor(percent: number): string {
  if (percent >= 70) return '#1D9E75'
  if (percent >= 40) return '#EF9F27'
  return '#E24B4A'
}

function VariationBadge({ current, previous, suffix }: { current: number; previous: number; suffix?: string }) {
  if (previous <= 0) return null
  const diff = current - previous
  const pct = Math.round((diff / previous) * 100)
  const isUp = diff >= 0

  return (
    <div className="flex flex-col items-start gap-0.5 mt-1.5">
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
          isUp
            ? 'bg-[#1D9E75]/15 text-[#1D9E75]'
            : 'bg-[#E24B4A]/15 text-[#E24B4A]'
        }`}
      >
        {isUp ? '▲' : '▼'} {Math.abs(pct)}%
      </span>
      <span className="text-[10px] text-muted-foreground">
        vs ontem ({previous.toLocaleString('pt-BR')}{suffix ? ` ${suffix}` : ''})
      </span>
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  valueColor?: string
  current?: number
  previous?: number
  suffix?: string
}

function KpiCard({ label, value, valueColor, current, previous, suffix }: KpiCardProps) {
  return (
    <div className="bg-card border rounded-lg p-4 flex flex-col justify-between min-h-[100px]">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">
        {label}
      </p>
      <div>
        <p
          className="text-[28px] font-normal tabular-nums leading-none mt-2"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </p>
        {current !== undefined && previous !== undefined && previous > 0 && (
          <VariationBadge current={current} previous={previous} suffix={suffix} />
        )}
      </div>
    </div>
  )
}

export function ResumoGeral({ resumo, comparacao }: ResumoGeralProps) {
  const percentColor = getPercentColor(resumo.percent_conclusao)

  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiCard
        label="Total de pedidos"
        value={resumo.total_pedidos.toLocaleString('pt-BR')}
        current={resumo.total_pedidos}
        previous={comparacao?.total_pedidos_ontem}
      />
      <KpiCard
        label="Pecas separadas"
        value={resumo.pecas_separadas.toLocaleString('pt-BR')}
        current={resumo.pecas_separadas}
        previous={comparacao?.pecas_separadas_ontem}
        suffix="pcs"
      />
      <KpiCard
        label="% Conclusao"
        value={`${resumo.percent_conclusao}%`}
        valueColor={percentColor}
      />
      <KpiCard
        label="Fardos processados"
        value={resumo.fardos_processados.toLocaleString('pt-BR')}
        current={resumo.fardos_processados}
        previous={comparacao?.fardos_processados_ontem}
      />
    </div>
  )
}
