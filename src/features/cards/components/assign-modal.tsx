'use client'

import { User, Check } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface AssignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardKey: string
  filterRole: 'separador' | 'fardista'
  users: { id: string; nome: string }[]
  currentUserId: string | null
  onAssign: (cardKey: string, userId: string) => void
}

export function AssignModal({
  open,
  onOpenChange,
  cardKey,
  filterRole,
  users,
  currentUserId,
  onAssign,
}: AssignModalProps) {
  const title =
    filterRole === 'separador' ? 'Atribuir Separador' : 'Atribuir Fardista'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Selecione um usuario para atribuir ao card
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1 mt-2">
          {users.map((user) => (
            <button
              key={user.id}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg w-full text-left hover:bg-muted',
                user.id === currentUserId && 'bg-muted font-bold'
              )}
              onClick={() => {
                onAssign(cardKey, user.id)
                onOpenChange(false)
              }}
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="flex-1">{user.nome}</span>
              {user.id === currentUserId && (
                <Check className="h-4 w-4 text-green-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
