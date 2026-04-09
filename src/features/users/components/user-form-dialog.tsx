'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  validateUserForm,
  type ValidationErrors,
} from '@/features/users/lib/user-validation'
import type { UserRow } from '@/features/users/hooks/use-users'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  user?: UserRow | null
  onSubmit: (data: { nome: string; pin?: string; role: string }) => Promise<void>
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'lider', label: 'Lider' },
  { value: 'separador', label: 'Separador' },
  { value: 'fardista', label: 'Fardista' },
]

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  user,
  onSubmit,
}: UserFormDialogProps) {
  const [nome, setNome] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [role, setRole] = useState('')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && user) {
        setNome(user.nome)
        setRole(user.role)
      } else {
        setNome('')
        setRole('')
      }
      setPin('')
      setPinConfirm('')
      setErrors({})
      setSaving(false)
    }
  }, [open, mode, user])

  const handleSubmit = async () => {
    const result = validateUserForm(
      { nome, pin, pinConfirm, role },
      { pinRequired: mode === 'create' }
    )

    if (!result.valid) {
      setErrors(result.errors)
      return
    }

    setErrors({})
    setSaving(true)

    try {
      const data: { nome: string; pin?: string; role: string } = {
        nome: nome.trim(),
        role,
      }
      if (pin) {
        data.pin = pin
      }
      await onSubmit(data)
    } catch {
      // Parent handles toast error
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Usuario' : 'Editar Usuario'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="user-nome">Nome</Label>
            <Input
              id="user-nome"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={saving}
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome}</p>
            )}
          </div>

          {/* PIN */}
          <div className="space-y-2">
            <Label htmlFor="user-pin">PIN</Label>
            <Input
              id="user-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder={
                mode === 'edit' ? 'Deixe vazio para manter atual' : '4-6 digitos'
              }
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={saving}
            />
            {errors.pin && (
              <p className="text-sm text-destructive">{errors.pin}</p>
            )}
          </div>

          {/* PIN Confirm */}
          <div className="space-y-2">
            <Label htmlFor="user-pin-confirm">Confirmar PIN</Label>
            <Input
              id="user-pin-confirm"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Repita o PIN"
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value)}
              disabled={saving}
            />
            {errors.pinConfirm && (
              <p className="text-sm text-destructive">{errors.pinConfirm}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Funcao</Label>
            <Select value={role} onValueChange={setRole} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma funcao" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
