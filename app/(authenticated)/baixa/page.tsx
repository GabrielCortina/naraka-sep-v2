import type { Metadata } from 'next'
import { BaixaPageClient } from '@/features/baixa/components/baixa-page-client'

export const metadata: Metadata = {
  title: 'Baixa | NARAKA SEP v2',
}

export default function BaixaPage() {
  return <BaixaPageClient />
}
