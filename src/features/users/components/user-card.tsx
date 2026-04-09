'use client'

import { Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { UserRow } from '@/features/users/hooks/use-users'

interface UserCardProps {
  user: UserRow
  onEdit: (user: UserRow) => void
  onToggleAtivo: (user: UserRow) => void
}

export function UserCard({ user, onEdit, onToggleAtivo }: UserCardProps) {
  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{user.nome}</span>
        <Badge variant="secondary">
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <Badge
          variant={user.ativo ? 'default' : 'outline'}
          className={
            user.ativo
              ? 'bg-green-600 text-white hover:bg-green-600'
              : 'text-muted-foreground'
          }
        >
          {user.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(user)}
            aria-label={`Editar ${user.nome}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Switch
            checked={user.ativo}
            onCheckedChange={() => onToggleAtivo(user)}
            aria-label={`Ativar/desativar ${user.nome}`}
          />
        </div>
      </div>
    </div>
  )
}
