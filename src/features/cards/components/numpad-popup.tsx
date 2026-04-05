'use client'

import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface NumpadPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quantidadeNecessaria: number
  onConfirm: (quantidade: number) => void
}

export function NumpadPopup({
  open,
  onOpenChange,
  quantidadeNecessaria,
  onConfirm,
}: NumpadPopupProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) {
      setValue('')
    }
  }, [open])

  function appendDigit(d: number) {
    setValue((prev) => {
      if (prev.length >= 5) return prev
      return prev + String(d)
    })
  }

  function handleBackspace() {
    setValue((prev) => prev.slice(0, -1))
  }

  function handleConfirm() {
    const qty = parseInt(value || '0', 10)
    if (qty >= 0 && qty <= quantidadeNecessaria) {
      onConfirm(qty)
      onOpenChange(false)
      setValue('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Confirmar Quantidade</DialogTitle>
          <DialogDescription className="sr-only">
            Digite a quantidade separada usando o teclado numerico
          </DialogDescription>
        </DialogHeader>

        <div className="text-2xl font-bold text-center py-4">
          {value || '0'}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Quantidade necessaria: {quantidadeNecessaria}
        </p>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <Button
              key={d}
              variant="outline"
              className="h-12 text-lg font-bold"
              onClick={() => appendDigit(d)}
            >
              {d}
            </Button>
          ))}

          <Button
            variant="outline"
            className="h-12"
            onClick={handleBackspace}
          >
            <Delete className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            className="h-12 text-lg font-bold"
            onClick={() => appendDigit(0)}
          >
            0
          </Button>

          <Button
            className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
            onClick={handleConfirm}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
