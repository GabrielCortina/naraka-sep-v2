'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { PeriodFilter as PeriodFilterType } from '../types'

interface PeriodFilterProps {
  periodFilter: {
    period: PeriodFilterType
    setPeriod: (value: PeriodFilterType) => void
    customStart: string
    setCustomStart: (value: string) => void
    customEnd: string
    setCustomEnd: (value: string) => void
  }
}

const PERIOD_OPTIONS: { value: PeriodFilterType; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '15d', label: 'Ultimos 15 dias' },
  { value: '30d', label: 'Ultimos 30 dias' },
  { value: 'mes_atual', label: 'Mes atual' },
  { value: 'ultimo_mes', label: 'Ultimo mes' },
  { value: '3m', label: 'Ultimos 3 meses' },
  { value: 'personalizado', label: 'Periodo personalizado' },
]

export function PeriodFilter({ periodFilter }: PeriodFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <Select
        value={periodFilter.period}
        onValueChange={(v) => periodFilter.setPeriod(v as PeriodFilterType)}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {periodFilter.period === 'personalizado' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">De</label>
          <Input
            type="date"
            className="h-8 text-xs w-[130px]"
            value={periodFilter.customStart}
            onChange={(e) => periodFilter.setCustomStart(e.target.value)}
          />
          <label className="text-xs text-muted-foreground">Ate</label>
          <Input
            type="date"
            className="h-8 text-xs w-[130px]"
            value={periodFilter.customEnd}
            onChange={(e) => periodFilter.setCustomEnd(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
