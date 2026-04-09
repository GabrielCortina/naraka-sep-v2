'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BaixaInputProps {
  onSearch: (codigo: string) => void
  hasError: boolean
  disabled: boolean
  inputRef: React.RefObject<HTMLInputElement>
  onCameraClick?: () => void
}

export function BaixaInput({
  onSearch,
  hasError,
  disabled,
  inputRef,
  onCameraClick,
}: BaixaInputProps) {
  const [value, setValue] = useState('')

  // Auto-focus on mount (D-01)
  useEffect(() => {
    inputRef.current?.focus()
  }, [inputRef])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed) {
        onSearch(trimmed)
        setValue('')
      }
    }
  }

  return (
    <div className="w-[80%] md:w-[50%]">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-[10px] font-semibold uppercase text-muted-foreground mb-2 tracking-wide">
          Código do fardo
        </label>
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite ou escaneie o código IN..."
            disabled={disabled}
            className={cn(
              'text-xl h-14 border-2',
              hasError && 'border-red-500',
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-14 w-14 shrink-0 border-2"
            disabled={disabled}
            onClick={onCameraClick}
            aria-label="Escanear com camera"
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
