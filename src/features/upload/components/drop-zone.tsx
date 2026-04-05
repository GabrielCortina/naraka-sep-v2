'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { CloudUpload, FileSpreadsheet, Loader2, X, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UploadStep } from '@/features/upload/hooks/use-upload'

interface DropZoneProps {
  file: File | null
  step: UploadStep
  inputRef: React.RefObject<HTMLInputElement>
  handleDrop: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleProcess: () => void
  handleReset: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(bytes / 1024).toFixed(0)} KB`
}

export function DropZone({
  file,
  step,
  inputRef,
  handleDrop,
  handleDragOver,
  handleFileSelect,
  handleProcess,
  handleReset,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isInvalidDrag, setIsInvalidDrag] = useState(false)
  const processButtonRef = useRef<HTMLButtonElement>(null)

  const isProcessing = step === 'parsing' || step === 'confirming'
  const showDropZone = step === 'idle' || step === 'file-selected' || step === 'parsing'

  // Focar no botao "Processar planilha" quando arquivo e selecionado
  useEffect(() => {
    if (step === 'file-selected' && processButtonRef.current) {
      processButtonRef.current.focus()
    }
  }, [step])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleDragOver(e)

    // Verificar se o arquivo arrastado e .xlsx
    const items = e.dataTransfer.items
    if (items && items.length > 0) {
      const item = items[0]
      if (item.kind === 'file') {
        // Nao e possivel verificar extensao durante drag, apenas no drop
        setIsDragOver(true)
        setIsInvalidDrag(false)
      }
    } else {
      setIsDragOver(true)
    }
  }, [handleDragOver])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setIsInvalidDrag(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && !droppedFile.name.toLowerCase().endsWith('.xlsx')) {
      setIsInvalidDrag(true)
      setTimeout(() => setIsInvalidDrag(false), 300)
      // handleDrop vai tratar o erro
    }

    handleDrop(e)
  }, [handleDrop])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }, [inputRef])

  if (!showDropZone) return null

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona de upload de planilha .xlsx"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onKeyDown={onKeyDown}
        className={`
          relative flex flex-col items-center justify-center gap-5
          min-h-[280px] py-14 px-6
          rounded-xl transition-all duration-150 ease-in-out
          outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${step === 'idle' && !isDragOver && !isInvalidDrag
            ? 'border-2 border-dashed border-border/60 bg-muted/30 cursor-pointer hover:bg-muted/50 hover:border-border'
            : ''
          }
          ${isDragOver
            ? 'border-2 border-dashed border-primary bg-primary/5 scale-[1.01]'
            : ''
          }
          ${isInvalidDrag
            ? 'border-2 border-dashed border-destructive animate-[shake_300ms_ease-in-out]'
            : ''
          }
          ${step === 'file-selected' || step === 'parsing'
            ? 'border-2 border-solid border-border bg-muted/20'
            : ''
          }
        `}
      >
        {/* Estado idle */}
        {step === 'idle' && !isDragOver && (
          <>
            <CloudUpload
              className="h-16 w-16 text-muted-foreground/60"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div className="text-center space-y-1.5">
              <p className="text-lg font-semibold text-foreground">
                Arraste o arquivo Excel aqui
              </p>
              <p className="text-sm text-muted-foreground">
                ou clique para selecionar
              </p>
            </div>
            <Button
              className="mt-2 uppercase tracking-wide font-semibold"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
              disabled={isProcessing}
            >
              <FolderOpen className="h-4 w-4 mr-2" aria-hidden="true" />
              Enviar Arquivo
            </Button>
          </>
        )}

        {/* Estado drag-over */}
        {step === 'idle' && isDragOver && (
          <>
            <CloudUpload
              className="h-16 w-16 text-primary scale-110 transition-transform duration-200"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-primary">Solte o arquivo aqui</p>
          </>
        )}

        {/* Estado file-selected */}
        {step === 'file-selected' && file && (
          <>
            <FileSpreadsheet
              className="h-14 w-14 text-primary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div className="text-center space-y-1">
              <p className="font-semibold text-sm">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              ref={processButtonRef}
              className="mt-1"
              onClick={(e) => {
                e.stopPropagation()
                handleProcess()
              }}
            >
              Processar planilha
            </Button>
          </>
        )}

        {/* Estado parsing/processing */}
        {step === 'parsing' && (
          <>
            <Loader2
              className="h-14 w-14 text-primary animate-spin"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p
              className="text-sm text-muted-foreground"
              aria-live="polite"
              aria-busy="true"
            >
              Processando arquivo...
            </p>
          </>
        )}
      </div>

      {/* Input file hidden */}
      <input
        type="file"
        accept=".xlsx"
        ref={inputRef}
        onChange={handleFileSelect}
        className="hidden"
        tabIndex={-1}
      />

      {/* Botao voltar */}
      {step !== 'idle' && (
        <div className="flex justify-center pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isProcessing}
          >
            <X className="h-4 w-4 mr-1" aria-hidden="true" />
            Voltar ao upload
          </Button>
        </div>
      )}
    </div>
  )
}
