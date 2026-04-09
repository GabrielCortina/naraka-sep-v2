'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useUsers, type UserRow } from '@/features/users/hooks/use-users'
import { UsersTable } from '@/features/users/components/users-table'
import { UserFormDialog } from '@/features/users/components/user-form-dialog'
import { DeactivateDialog } from '@/features/users/components/deactivate-dialog'

export function UsuariosClient() {
  const { users, loading, createUser, updateUser, toggleAtivo } = useUsers()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [deactivateUser, setDeactivateUser] = useState<UserRow | null>(null)

  const handleOpenCreate = () => {
    setDialogMode('create')
    setEditingUser(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: UserRow) => {
    setDialogMode('edit')
    setEditingUser(user)
    setDialogOpen(true)
  }

  const handleToggleAtivo = async (user: UserRow) => {
    if (user.ativo) {
      // Deactivating -> show confirmation
      setDeactivateUser(user)
    } else {
      // Reactivating -> immediate
      try {
        await toggleAtivo(user.id, true)
        toast.success('Usuario reativado')
      } catch (err) {
        toast.error(
          `Erro: ${err instanceof Error ? err.message : 'Erro ao alterar status'}`
        )
      }
    }
  }

  const handleSubmit = async (data: {
    nome: string
    pin?: string
    role: string
  }) => {
    if (dialogMode === 'create') {
      try {
        await createUser({
          nome: data.nome,
          pin: data.pin || '',
          role: data.role,
        })
        toast.success('Usuario criado com sucesso')
        setDialogOpen(false)
      } catch (err) {
        toast.error(
          `Erro: ${err instanceof Error ? err.message : 'Erro ao salvar usuario'}`
        )
        throw err
      }
    } else if (editingUser) {
      try {
        const body: Record<string, unknown> = {
          nome: data.nome,
          role: data.role,
        }
        if (data.pin) {
          body.pin = data.pin
        }
        await updateUser(editingUser.id, body)
        toast.success('Usuario atualizado com sucesso')
        setDialogOpen(false)
      } catch (err) {
        toast.error(
          `Erro: ${err instanceof Error ? err.message : 'Erro ao salvar usuario'}`
        )
        throw err
      }
    }
  }

  const handleDeactivateConfirm = async () => {
    if (!deactivateUser) return
    try {
      await toggleAtivo(deactivateUser.id, false)
      toast.success('Usuario desativado')
      setDeactivateUser(null)
    } catch (err) {
      toast.error(
        `Erro: ${err instanceof Error ? err.message : 'Erro ao alterar status'}`
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          + Novo Usuario
        </Button>
      </div>

      <UsersTable
        users={users}
        loading={loading}
        onEdit={handleOpenEdit}
        onToggleAtivo={handleToggleAtivo}
      />

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        user={editingUser}
        onSubmit={handleSubmit}
      />

      <DeactivateDialog
        open={deactivateUser !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateUser(null)
        }}
        user={deactivateUser}
        onConfirm={handleDeactivateConfirm}
      />
    </div>
  )
}
