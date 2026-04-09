'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface DashboardBlockProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  headerRight?: React.ReactNode
}

export function DashboardBlock({
  title,
  children,
  defaultOpen = false,
  headerRight,
}: DashboardBlockProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="bg-secondary border rounded-lg p-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 text-left">
              <span className="text-xs font-semibold uppercase">{title}</span>
              {open ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </CollapsibleTrigger>
          {headerRight && <div>{headerRight}</div>}
        </div>
        <CollapsibleContent className="mt-4">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
