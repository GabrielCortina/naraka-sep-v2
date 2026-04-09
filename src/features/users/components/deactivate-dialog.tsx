'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { UserRow } from '@/features/users/hooks/use-users'

interface DeactivateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRow | null
  onConfirm: () => Promise<void>
}

export function DeactivateDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
}: DeactivateDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Desativar usuario</DialogTitle>
          <DialogDescription>
            Tem certeza? {user?.nome} nao conseguira mais logar no sistema.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Desativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
