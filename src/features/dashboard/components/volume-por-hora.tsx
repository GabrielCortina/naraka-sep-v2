'use client'

import type { VolumePorHora as VolumePorHoraType } from '../types'

interface VolumePorHoraProps {
  data: VolumePorHoraType[]
}

export function VolumePorHora({ data }: VolumePorHoraProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">Sem dados de volume por hora</p>
      </div>
    )
  }

  const currentHour = new Date().getHours()
  const maxPecas = Math.max(...data.map(d => d.pecas), 1)

  // Find peak hour
  const peak = data.reduce((best, d) => d.pecas > best.pecas ? d : best, data[0])
  const peakEnd = peak.hora + 1

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-end gap-[3px] h-[120px]">
        {data.map(({ hora, pecas }) => {
          const heightPct = maxPecas > 0 ? Math.max((pecas / maxPecas) * 100, pecas > 0 ? 4 : 0) : 0
          const isCurrent = hora === currentHour
          const isFuture = hora > currentHour
          const barOpacity = isFuture ? 'opacity-30' : ''

          return (
            <div
              key={hora}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <div
                className={`w-full rounded-t transition-all duration-300 ${barOpacity} ${
                  isCurrent ? 'bg-[#1e40af]' : 'bg-[#378ADD]'
                }`}
                style={{ height: `${heightPct}%`, minHeight: pecas > 0 ? 3 : 0 }}
                title={`${hora}h: ${pecas} pecas`}
              />
              <span className={`text-[8px] mt-1 tabular-nums ${
                isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground'
              }`}>
                {hora}
              </span>
            </div>
          )
        })}
      </div>

      {peak.pecas > 0 && (
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Pico: {peak.hora}h–{peakEnd}h · {peak.pecas.toLocaleString('pt-BR')} pecas/hora
        </p>
      )}
    </div>
  )
}
