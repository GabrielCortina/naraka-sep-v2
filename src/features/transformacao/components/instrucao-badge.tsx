import type { InstrucaoLider } from '../types'

const INSTRUCAO_CONFIG: Record<InstrucaoLider, { label: string; bg: string; text: string }> = {
  TRANSFORMACAO_LIBERADA: { label: 'Liberada', bg: 'bg-green-100', text: 'text-green-700' },
  SKU_VAI_CHEGAR: { label: 'Vai chegar', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  PEGAR_NA_VALERIA: { label: 'Valeria', bg: 'bg-blue-100', text: 'text-blue-700' },
  PEGAR_NA_LOJA: { label: 'Loja', bg: 'bg-purple-100', text: 'text-purple-700' },
}

interface InstrucaoBadgeProps {
  instrucao: InstrucaoLider | null
}

export function InstrucaoBadge({ instrucao }: InstrucaoBadgeProps) {
  if (!instrucao) return null

  const config = INSTRUCAO_CONFIG[instrucao]
  if (!config) return null

  return (
    <span
      className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  )
}
