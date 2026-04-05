'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardKey: string
  cardLabel: string
  onConfirm: (cardKey: string, pin: string) => void
}

export function DeleteCardModal({
  open,
  onOpenChange,
  cardKey,
  cardLabel,
  onConfirm,
}: DeleteCardModalProps) {
  const [step, setStep] = useState<'confirm' | 'pin'>('confirm')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setStep('confirm')
      setPin('')
      setLoading(false)
    }
    onOpenChange(isOpen)
  }

  function handleConfirmStep() {
    setStep('pin')
  }

  async function handleSubmit() {
    if (!pin.trim()) return
    setLoading(true)
    onConfirm(cardKey, pin)
    // Parent handles the result — reset will happen on close
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Card
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4">
            <p className="text-sm">
              Tem certeza que deseja excluir o card{' '}
              <span className="font-bold">{cardLabel}</span>?
            </p>
            <p className="text-xs text-muted-foreground">
              Todos os pedidos, progresso e reservas exclusivas deste card serão removidos.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClose(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmStep}
              >
                Sim, excluir
              </Button>
            </div>
          </div>
        )}

        {step === 'pin' && (
          <div className="space-y-4">
            <p className="text-sm">
              Digite seu PIN para confirmar a exclusão:
            </p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="PIN"
              autoFocus
              className="w-full h-12 text-center text-2xl font-bold tracking-[0.5em] border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep('confirm')
                  setPin('')
                }}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={pin.length < 4 || loading}
                onClick={handleSubmit}
              >
                {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
