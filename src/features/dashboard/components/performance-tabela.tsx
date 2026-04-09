'use client'

import { useState } from 'react'
import type { PerformanceSemanal } from '../types'
import { subtractDays } from '../lib/date-utils'

interface PerformanceTabelaProps {
  data: PerformanceSemanal[]
}

function getDayLabel(dateStr: string): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return days[date.getDay()]
}

function getHeatmapBg(value: number, min: number, max: number): string {
  if (value === 0) return 'transparent'
  const range = max - min || 1
  const intensity = (value - min) / range
  const alpha = 0.15 + intensity * 0.55
  return `rgba(55, 138, 221, ${alpha})`
}

function getRowHighlight(value: number, best: number, worst: number): string | null {
  if (value === best && best > 0) return 'rgba(29, 158, 117, 0.12)'
  if (value === worst && worst > 0 && best !== worst) return 'rgba(226, 75, 74, 0.12)'
  return null
}

export function PerformanceTabela({ data }: PerformanceTabelaProps) {
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          Dados historicos insuficientes. O heatmap aparece apos o primeiro dia completo de operacao.
        </p>
      </div>
    )
  }

  const allDates = new Set<string>()
  for (const entry of data) {
    for (const date of Object.keys(entry.dias)) {
      allDates.add(date)
    }
  }
  for (let i = 6; i >= 0; i--) {
    allDates.add(subtractDays(new Date(), i))
  }
  const dates = Array.from(allDates).sort()

  let globalMin = Infinity
  let globalMax = 0
  for (const entry of data) {
    for (const v of Object.values(entry.dias)) {
      if (v > 0 && v < globalMin) globalMin = v
      if (v > globalMax) globalMax = v
    }
  }
  if (globalMin === Infinity) globalMin = 0

  const sorted = [...data]
  if (sortCol) {
    sorted.sort((a, b) => {
      let va: number, vb: number
      if (sortCol === 'media') {
        va = a.media; vb = b.media
      } else if (sortCol === 'tendencia') {
        const order = { up: 2, stable: 1, down: 0 }
        va = order[a.tendencia]; vb = order[b.tendencia]
      } else {
        va = a.dias[sortCol] ?? 0; vb = b.dias[sortCol] ?? 0
      }
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  return (
    <div className="bg-card border rounded-lg overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left text-muted-foreground font-medium px-3 py-2.5 sticky left-0 bg-card z-10">
              Separador
            </th>
            {dates.map(date => (
              <th
                key={date}
                className="text-center text-muted-foreground font-medium px-2 py-2.5 cursor-pointer hover:text-foreground transition-colors min-w-[48px]"
                onClick={() => handleSort(date)}
              >
                {getDayLabel(date)}
                {sortCol === date && (
                  <span className="ml-0.5 text-[10px]">{sortDir === 'desc' ? '↓' : '↑'}</span>
                )}
              </th>
            ))}
            <th
              className="text-center font-semibold text-[#378ADD] px-2 py-2.5 cursor-pointer hover:text-foreground transition-colors min-w-[52px]"
              onClick={() => handleSort('media')}
            >
              Media
              {sortCol === 'media' && (
                <span className="ml-0.5 text-[10px]">{sortDir === 'desc' ? '↓' : '↑'}</span>
              )}
            </th>
            <th
              className="text-center text-muted-foreground font-medium px-2 py-2.5 cursor-pointer hover:text-foreground transition-colors min-w-[40px]"
              onClick={() => handleSort('tendencia')}
            >
              Tend.
              {sortCol === 'tendencia' && (
                <span className="ml-0.5 text-[10px]">{sortDir === 'desc' ? '↓' : '↑'}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => {
            const values = dates.map(d => entry.dias[d] ?? 0).filter(v => v > 0)
            const best = values.length > 0 ? Math.max(...values) : 0
            const worst = values.length > 0 ? Math.min(...values) : 0

            return (
              <tr key={entry.separador_nome} className="border-b last:border-b-0">
                <td className="font-medium px-3 py-2 sticky left-0 bg-card z-10 whitespace-nowrap">
                  {entry.separador_nome}
                </td>
                {dates.map(date => {
                  const val = entry.dias[date] ?? 0
                  const rowHighlight = val > 0 ? getRowHighlight(val, best, worst) : null
                  const heatBg = val > 0 ? getHeatmapBg(val, globalMin, globalMax) : 'transparent'

                  return (
                    <td
                      key={date}
                      className="text-center tabular-nums py-2 px-1"
                      style={{ backgroundColor: rowHighlight ?? heatBg }}
                    >
                      {val > 0 ? (
                        <span>{val}</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  )
                })}
                <td
                  className="text-center font-bold tabular-nums py-2 px-1"
                  style={{ backgroundColor: 'rgba(55, 138, 221, 0.1)' }}
                >
                  {entry.media}
                </td>
                <td className="text-center py-2 px-1">
                  <span className={
                    entry.tendencia === 'up' ? 'text-[#1D9E75] font-bold' :
                    entry.tendencia === 'down' ? 'text-[#E24B4A] font-bold' :
                    'text-muted-foreground'
                  }>
                    {entry.tendencia === 'up' ? '▲' : entry.tendencia === 'down' ? '▼' : '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
