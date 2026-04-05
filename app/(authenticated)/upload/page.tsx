import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { UploadClient } from '@/features/upload/components/upload-client'
import type { ImportRecord } from '@/features/upload/types'
import type { TipoPedido } from '@/types'

export const metadata: Metadata = {
  title: 'Upload | NARAKA SEP v2',
}

export default async function UploadPage() {
  const supabase = await createClient()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  // Buscar pedidos do dia agrupados por importacao_numero
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('importacao_numero, tipo, grupo_envio, created_at')
    .eq('importacao_data', today)
    .order('importacao_numero', { ascending: false })

  // Agrupar por importacao_numero para montar ImportRecord[]
  const importMap = new Map<
    number,
    { tipos: Record<string, number>; grupos: Record<string, number>; horario: string; total: number }
  >()

  for (const p of pedidos ?? []) {
    const existing = importMap.get(p.importacao_numero) ?? {
      tipos: {},
      grupos: {},
      horario: p.created_at,
      total: 0,
    }
    existing.tipos[p.tipo] = (existing.tipos[p.tipo] ?? 0) + 1
    existing.grupos[p.grupo_envio] = (existing.grupos[p.grupo_envio] ?? 0) + 1
    existing.total++
    importMap.set(p.importacao_numero, existing)
  }

  const initialImports: ImportRecord[] = Array.from(importMap.entries()).map(
    ([num, data]) => ({
      importacao_numero: num,
      horario: data.horario,
      total_pedidos: data.total,
      por_tipo: data.tipos as Record<TipoPedido, number>,
      por_grupo: data.grupos,
    })
  )

  return <UploadClient initialImports={initialImports} />
}
