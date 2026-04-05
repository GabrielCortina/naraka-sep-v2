'use client'

import { useUpload } from '@/features/upload/hooks/use-upload'
import { DropZone } from '@/features/upload/components/drop-zone'
import { ImportPreview } from '@/features/upload/components/import-preview'
import { ImportList } from '@/features/upload/components/import-list'
import { ProcessingSpinner } from '@/features/upload/components/processing-spinner'
import type { ImportRecord } from '@/features/upload/types'

interface UploadClientProps {
  initialImports: ImportRecord[]
}

export function UploadClient({ initialImports }: UploadClientProps) {
  const {
    step,
    file,
    parseResult,
    summary,
    importacao_numero,
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
  } = useUpload(initialImports)

  const isProcessing = step === 'confirming'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Upload</h1>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <DropZone
        file={file}
        step={step}
        inputRef={inputRef}
        handleDrop={handleDrop}
        handleDragOver={handleDragOver}
        handleFileSelect={handleFileSelect}
        handleProcess={handleProcess}
        handleReset={handleReset}
      />

      {(step === 'preview' || step === 'confirming' || step === 'success') && parseResult && (
        <ImportPreview
          parseResult={parseResult}
          summary={summary}
          importacao_numero={importacao_numero}
          step={step}
          onConfirm={handleConfirm}
          onReset={handleReset}
        />
      )}

      <ProcessingSpinner visible={isProcessing} />

      <ImportList
        imports={imports}
        onUndo={handleUndo}
        isProcessing={isProcessing}
      />
    </div>
  )
}
