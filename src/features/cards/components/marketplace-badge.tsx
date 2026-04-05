'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MARKETPLACE_COLORS } from '../lib/deadline-config'

interface MarketplaceBadgeProps {
  grupoEnvio: string
}

export function MarketplaceBadge({ grupoEnvio }: MarketplaceBadgeProps) {
  const colors = MARKETPLACE_COLORS[grupoEnvio] ?? {
    bg: 'bg-muted',
    text: 'text-foreground',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'uppercase font-bold text-xs border-0',
        colors.bg,
        colors.text,
      )}
    >
      {grupoEnvio}
    </Badge>
  )
}
