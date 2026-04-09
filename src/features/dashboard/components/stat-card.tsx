'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  value: number
  label: string
  variant?: 'default' | 'destructive'
}

export function StatCard({ value, label, variant = 'default' }: StatCardProps) {
  const isDestructive = variant === 'destructive' && value > 0

  return (
    <Card
      className={cn('p-4', isDestructive && 'bg-destructive/5')}
      aria-label={`${label}: ${value}`}
    >
      <p
        className={cn(
          'text-4xl font-semibold',
          isDestructive && 'text-destructive',
        )}
      >
        {value}
      </p>
      <p className="text-xs font-semibold uppercase text-muted-foreground mt-1">
        {label}
      </p>
    </Card>
  )
}
