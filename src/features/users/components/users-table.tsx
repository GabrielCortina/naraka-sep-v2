'use client'

import { Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UserRow } from '@/features/users/hooks/use-users'
import { UserCard } from './user-card'

interface UsersTableProps {
  users: UserRow[]
  loading: boolean
  onEdit: (user: UserRow) => void
  onToggleAtivo: (user: UserRow) => void
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
        </div>
      </TableCell>
    </TableRow>
  )
}

function SkeletonCard() {
  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
}

export function UsersTable({
  users,
  loading,
  onEdit,
  onToggleAtivo,
}: UsersTableProps) {
  if (!loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Nenhum usuario cadastrado
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Clique em &quot;+ Novo Usuario&quot; para adicionar o primeiro usuario.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          : users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={onEdit}
                onToggleAtivo={onToggleAtivo}
              />
            ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                Nome
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                Funcao
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                Acoes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              : users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
