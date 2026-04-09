'use client'

import type { ProgressaoMetodo as ProgressaoMetodoType } from '../types'
import { DashboardBlock } from './dashboard-block'
import { ProgressBar } from '@/features/cards/components/progress-bar'
import { UrgencyBadge } from '@/features/cards/components/urgency-badge'
import { MarketplaceBadge } from '@/features/cards/components/marketplace-badge'
import { formatCountdown } from '@/features/cards/lib/card-utils'

interface ProgressaoMetodoProps {
  progressao: ProgressaoMetodoType[]
}

export function ProgressaoMetodo({ progressao }: ProgressaoMetodoProps) {
  return (
    <DashboardBlock title="PROGRESSAO POR METODO">
      {progressao.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum dado disponivel</p>
      ) : (
        <div>
          {progressao.map((entry) => {
            const countdown = formatCountdown(entry.deadline_ms)
            return (
              <div key={entry.grupo_envio}>
                {/* Desktop row */}
                <div className="hidden lg:flex items-center gap-2 py-2 border-b last:border-b-0">
                  <MarketplaceBadge grupoEnvio={entry.grupo_envio} />
                  <span className="text-sm whitespace-nowrap">
                    {entry.grupo_envio}
                  </span>
                  <div className="flex-1">
                    <ProgressBar
                      percent={entry.percent}
                      urgency={entry.urgency}
                    />
                  </div>
                  <span className="text-sm whitespace-nowrap">
                    {entry.pecas_separadas}/{entry.total_pecas} pecas
                  </span>
                  <span className="text-sm whitespace-nowrap">
                    {countdown ?? ''}
                  </span>
                  <UrgencyBadge urgency={entry.urgency} countdown={countdown} />
                </div>
                {/* Mobile row */}
                <div className="flex lg:hidden flex-col gap-1 py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <MarketplaceBadge grupoEnvio={entry.grupo_envio} />
                    <span className="text-sm">{entry.grupo_envio}</span>
                  </div>
                  <ProgressBar
                    percent={entry.percent}
                    urgency={entry.urgency}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {entry.pecas_separadas}/{entry.total_pecas} pecas
                    </span>
                    <span className="text-sm">{countdown ?? ''}</span>
                    <UrgencyBadge
                      urgency={entry.urgency}
                      countdown={countdown}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardBlock>
  )
}
