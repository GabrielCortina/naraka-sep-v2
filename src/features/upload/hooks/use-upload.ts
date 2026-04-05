'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { parseXlsx, type ParseResult } from '@/features/upload/lib/parse-xlsx'
import type { ImportSummary, ImportRecord } from '@/features/upload/types'

export type UploadStep = 'idle' | 'file-selected' | 'parsing' | 'preview' | 'confirming' | 'success'

interface UploadApiResponse {
  success: boolean
  dayReset: boolean
  importacao_numero: number
  summary: ImportSummary
  error?: string
}

interface UndoApiResponse {
  success: boolean
  importacao_numero: number
  pedidos_removidos: number
  error?: string
}

export function useUpload(initialImports: ImportRecord[] = []) {
  const [step, setStep] = useState<UploadStep>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [importacao_numero, setImportacaoNumero] = useState<number | null>(null)
  const [dayReset, setDayReset] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imports, setImports] = useState<ImportRecord[]>(initialImports)
  const inputRef = useRef<HTMLInputElement>(null)

  const isXlsx = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.xlsx')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)

    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) return

    if (!isXlsx(droppedFile.name)) {
      setError('Formato invalido — Selecione um arquivo .xlsx')
      toast.error('Formato invalido — Selecione um arquivo .xlsx')
      return
    }

    setFile(droppedFile)
    setStep('file-selected')
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!isXlsx(selectedFile.name)) {
      setError('Formato invalido — Selecione um arquivo .xlsx')
      toast.error('Formato invalido — Selecione um arquivo .xlsx')
      return
    }

    setFile(selectedFile)
    setStep('file-selected')
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleProcess = useCallback(async () => {
    if (!file) return

    setStep('parsing')
    setError(null)

    try {
      const buffer = await file.arrayBuffer()
      const result = parseXlsx(buffer)
      setParseResult(result)
      setStep('preview')
    } catch {
      const message = 'Erro ao processar arquivo — Verifique se o arquivo e um .xlsx valido do ERP UpSeller.'
      setError(message)
      toast.error(message)
      setStep('file-selected')
    }
  }, [file])

  const handleConfirm = useCallback(async () => {
    if (!parseResult) return

    setStep('confirming')
    setError(null)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parseResult.rows,
          filtered_status: parseResult.filtered_status,
          filtered_envio: parseResult.filtered_envio,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao salvar importacao')
      }

      const data: UploadApiResponse = await response.json()

      if (data.dayReset) {
        toast.info('Virada de dia — pedidos anteriores removidos')
        setDayReset(true)
        setImports([])
      }

      setSummary(data.summary)
      setImportacaoNumero(data.importacao_numero)

      // Adicionar ao historico de importacoes
      if (data.summary.total_validos > 0) {
        const newRecord: ImportRecord = {
          importacao_numero: data.importacao_numero,
          horario: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
          }),
          total_pedidos: data.summary.total_validos,
          por_tipo: data.summary.por_tipo,
          por_grupo: data.summary.por_grupo,
        }
        setImports(prev => [newRecord, ...prev])
      }

      toast.success(
        `Importacao #${data.importacao_numero} concluida — ${data.summary.total_validos} pedidos importados`
      )

      setStep('success')

      // Retornar ao idle apos 3s
      setTimeout(() => {
        setStep('idle')
        setFile(null)
        setParseResult(null)
        setSummary(null)
        setImportacaoNumero(null)
        setDayReset(false)
      }, 3000)
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Erro ao salvar importacao — Tente novamente. Se o problema persistir, contate o administrador.'
      setError(message)
      toast.error(message)
      setStep('preview')
    }
  }, [parseResult])

  const handleUndo = useCallback(async () => {
    if (imports.length === 0) return

    const latest = imports[0]
    const confirmed = window.confirm(
      `Desfazer importacao #${latest.importacao_numero}? Os ${latest.total_pedidos} pedidos desta importacao serao removidos.`
    )
    if (!confirmed) return

    try {
      const response = await fetch('/api/upload/undo', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao desfazer importacao')
      }

      const data: UndoApiResponse = await response.json()

      setImports(prev => prev.slice(1))
      toast.success(`Importacao #${data.importacao_numero} desfeita`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao desfazer importacao'
      toast.error(message)
    }
  }, [imports])

  const handleReset = useCallback(() => {
    setStep('idle')
    setFile(null)
    setParseResult(null)
    setSummary(null)
    setImportacaoNumero(null)
    setError(null)
    setDayReset(false)
    // Limpar o input para permitir re-selecionar o mesmo arquivo
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  return {
    step,
    file,
    parseResult,
    summary,
    importacao_numero,
    dayReset,
    error,
    imports,
    inputRef,
    handleDrop,
    handleDragOver,
    handleFileSelect,
    handleProcess,
    handleConfirm,
    handleUndo,
    handleReset,
  }
}
