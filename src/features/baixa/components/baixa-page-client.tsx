'use client'

import { useRef, useState } from 'react'
import { useBaixa } from '../hooks/use-baixa'
import { BaixaInput } from './baixa-input'
import { BaixaModal } from './baixa-modal'
import { BaixadosHoje } from './baixados-hoje'
import { CameraScanner } from './camera-scanner'

export function BaixaPageClient() {
  const [showCamera, setShowCamera] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    fardo,
    isSearching,
    isConfirming,
    modalOpen,
    hasError,
    baixadosHoje,
    search,
    confirm,
    cancel,
  } = useBaixa()

  async function handleSearch(codigo: string) {
    const result = await search(codigo)
    if (result.clear) {
      inputRef.current?.focus()
    }
  }

  async function handleConfirm() {
    const result = await confirm()
    if (result.success) {
      inputRef.current?.focus()
    }
  }

  function handleCancel() {
    cancel()
    inputRef.current?.focus()
  }

  function handleCameraScan(code: string) {
    handleSearch(code)
  }

  return (
    <div className="flex flex-col items-center pt-12 md:pt-16 min-h-screen bg-zinc-100">
      <BaixaInput
        onSearch={handleSearch}
        hasError={hasError}
        disabled={isSearching || modalOpen}
        inputRef={inputRef}
        onCameraClick={() => setShowCamera(true)}
      />

      <div className="mt-8 w-full flex flex-col items-center">
        <BaixadosHoje items={baixadosHoje} />
      </div>

      <BaixaModal
        fardo={fardo}
        open={modalOpen}
        isConfirming={isConfirming}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {showCamera && (
        <CameraScanner
          onScan={handleCameraScan}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}
