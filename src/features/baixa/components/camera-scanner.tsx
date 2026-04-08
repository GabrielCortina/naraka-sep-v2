'use client'

import { Suspense, useEffect, lazy } from 'react'
import { X, Loader2 } from 'lucide-react'

const Scanner = lazy(() =>
  import('@yudiel/react-qr-scanner').then((mod) => ({ default: mod.Scanner })),
)

interface CameraScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-10"
        aria-label="Fechar scanner"
      >
        <X className="h-8 w-8" />
      </button>

      <Suspense
        fallback={<Loader2 className="h-8 w-8 animate-spin text-white" />}
      >
        <div className="w-[280px] h-[280px]">
          <Scanner
            onScan={(result) => {
              if (result?.[0]?.rawValue) {
                onScan(result[0].rawValue)
                onClose()
              }
            }}
            formats={['code_128', 'ean_13', 'ean_8', 'upc_a']}
            components={{ torch: false, onOff: false, zoom: false }}
          />
        </div>
      </Suspense>
    </div>
  )
}
