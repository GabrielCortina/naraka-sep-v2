'use client'

import { useState, useEffect } from 'react'
import type { ProgressaoMetodo } from '../types'
import { DEADLINES, COLUMN_ORDER } from '@/features/cards/lib/deadline-config'

interface AlertasCorteProps {
  progressao: ProgressaoMetodo[]
}

function getDeadlineDate(hour: number): Date {
  const now = new Date()
  const deadline = new Date(now)
  deadline.setHours(hour, 0, 0, 0)
  return deadline
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getUrgencyColor(msRemaining: number, isComplete: boolean): { bg: string; text: string; border: string } {
  if (isComplete) return { bg: 'bg-card', text: 'text-[#1D9E75]', border: 'border-[#1D9E75]/30' }
  if (msRemaining <= 0) return { bg: 'bg-[#E24B4A]/5', text: 'text-[#E24B4A]', border: 'border-[#E24B4A]/30' }
  if (msRemaining < 2 * 60 * 60 * 1000) return { bg: 'bg-[#E24B4A]/5', text: 'text-[#E24B4A]', border: 'border-[#E24B4A]/30' }
  if (msRemaining < 4 * 60 * 60 * 1000) return { bg: 'bg-[#EF9F27]/5', text: 'text-[#EF9F27]', border: 'border-[#EF9F27]/30' }
  return { bg: 'bg-card', text: 'text-muted-foreground', border: 'border' }
}

export function AlertasCorte({ progressao }: AlertasCorteProps) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Build entries for all methods in COLUMN_ORDER
  const entries = COLUMN_ORDER.map(metodo => {
    const deadline = DEADLINES[metodo]
    const prog = progressao.find(p => p.grupo_envio === metodo)
    const deadlineMs = deadline !== undefined ? getDeadlineDate(deadline).getTime() - now : 0
    const isComplete = prog ? prog.percent === 100 : false

    return {
      metodo,
      deadlineHour: deadline,
      msRemaining: deadlineMs,
      pecasSeparadas: prog?.pecas_separadas ?? 0,
      totalPecas: prog?.total_pecas ?? 0,
      percent: prog?.percent ?? 0,
      isComplete,
    }
  })

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {entries.map(entry => {
        const colors = getUrgencyColor(entry.msRemaining, entry.isComplete)

        return (
          <div
            key={entry.metodo}
            className={`${colors.bg} ${colors.border} border rounded-lg p-3 text-center`}
          >
            <p className="text-[11px] font-medium text-muted-foreground truncate">
              {entry.metodo}
            </p>

            {entry.isComplete ? (
              <p className="text-lg font-semibold text-[#1D9E75] mt-1">
                Concluido
              </p>
            ) : entry.msRemaining <= 0 ? (
              <p className="text-lg font-semibold text-[#E24B4A] mt-1">
                Vencido
              </p>
            ) : (
              <p className={`text-lg font-semibold tabular-nums mt-1 ${colors.text}`}>
                {formatCountdown(entry.msRemaining)}
              </p>
            )}

            <p className="text-[10px] text-muted-foreground mt-1">
              corte {entry.deadlineHour}h
            </p>
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {entry.pecasSeparadas}/{entry.totalPecas} pedidos
            </p>
          </div>
        )
      })}
    </div>
  )
}
